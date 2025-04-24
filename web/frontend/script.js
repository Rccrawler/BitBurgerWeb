// --- START OF MODIFIED script.js ---

document.addEventListener('DOMContentLoaded', () => {
    const mainButton = document.getElementById('mainButton');
    const optionsMenu = document.getElementById('optionsMenu');

    // --- NUEVO: Define la URL a la que navegar en el segundo clic ---
    const secondClickUrl = 'index.html'; // <-- CAMBIA ESTO por tu URL deseada (p.ej., '/pagina-principal.html', 'https://google.com', etc.)
   // --- Lógica para el cuadro de estado ---
    // <<< AÑADIR ESTA LÍNEA >>>
    const statusTextElement = document.getElementById('statusText'); // Obtener el span

    const orderStatus = "Pedido en preparación"; // <-- DEFINE AQUÍ EL TEXTO/ESTADO

    // Ahora esta comprobación funciona porque statusTextElement está definido
    if (statusTextElement) {
        statusTextElement.textContent = orderStatus; // Asignar el texto al span
    } else {
        console.error("No se encontró el elemento #statusText.");
    }
    // --- FIN: Lógica para el cuadro de estado ---

    if (mainButton && optionsMenu) {
        mainButton.addEventListener('click', (event) => {
            event.stopPropagation(); // Previene que el clic llegue al document y cierre inmediatamente

            const isVisible = optionsMenu.classList.contains('visible');

            if (!isVisible) {
                // --- Primer clic: El menú NO está visible ---
                // Abrimos el menú
                optionsMenu.classList.add('visible'); // Usamos add en lugar de toggle
                mainButton.setAttribute('aria-expanded', 'true');
            } else {
                // --- Segundo clic: El menú YA está visible ---
                // Navegamos a la URL especificada
                console.log(`Redirigiendo a: ${secondClickUrl}`); // Mensaje útil para depuración
                window.location.href = secondClickUrl;
                // No necesitamos cerrar el menú aquí, la página cambiará
            }
        });

        // Cerrar el menú si se hace clic fuera de él (SIN CAMBIOS, sigue igual)
        document.addEventListener('click', (event) => {
            // Comprobamos que el menú esté visible Y que el clic NO sea ni en el menú ni en el botón principal
            if (optionsMenu.classList.contains('visible') &&
                !optionsMenu.contains(event.target) &&
                !mainButton.contains(event.target))
            {
                 optionsMenu.classList.remove('visible');
                 mainButton.setAttribute('aria-expanded', 'false');
            }
        });

         // Listeners para los botones de opción (SIN CAMBIOS, siguen igual)
        const optionButtons = optionsMenu.querySelectorAll('.option-button');
        optionButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                event.stopPropagation(); // Previene cerrar el menú al hacer clic en una opción Y que se active el listener del document
                alert(`Has hecho clic en: ${button.textContent}`);
                // Acción deseada al seleccionar una opción
                optionsMenu.classList.remove('visible'); // Cierra el menú
                mainButton.setAttribute('aria-expanded', 'false');
            });
        });

    } else {
        console.error("No se encontraron los elementos del botón o del menú.");
    }

    // --- Lógica del Carrusel (Estándar 3D + Plato Fijo - Items Más Grandes y Centrados) ---
    const carouselContainer = document.querySelector('.carousel-section.draggable-carousel .carousel-container');
    const plate = document.getElementById('carouselPlate'); // Plato INVISIBLE que rota items
    const items = plate?.querySelectorAll('.carousel-item');

    if (carouselContainer && plate && items && items.length > 0) {
        const itemCount = items.length;
        const anglePerItem = 360 / itemCount;
        // --- Ajustes de Configuración ---
        const itemBaseScale = 1;
        const itemActiveScale = 2.1;
        const itemActiveRaiseZ = 40; // <<< Quizás necesite más elevación >>>
        const dragSensitivity = 0.4;
        const snapTransitionDuration = '0.9s';
        // --- Fin Ajustes ---

        let radius = calculateRadius();
        let currentIndex = 0;
        let currentRotationY = 0;
        let startX = 0;
        let startRotationY = 0;
        let isDragging = false;

        function calculateRadius() {
            const containerWidth = carouselContainer.offsetWidth;
            // <<< CAMBIO: Aumentar el radio para ítems más grandes >>>
            // Necesitan más espacio para no solaparse. Un divisor más pequeño aumenta el radio.
            return Math.max(160, containerWidth / 2.3); // Prueba divisores entre 2.0 y 2.5
        }

        function setupCarousel() {
            radius = calculateRadius(); // Asegurarse de calcular el radio correcto
            console.log("Calculated Radius:", radius); // Para depuración

            plate.style.transform = `rotateY(0deg)`;

            items.forEach((item, index) => {
                // Asegurar que la posición inicial refleje el estado no activo
                positionItem(item, index, radius, 0, index === 0); // Marcar el primero como activo
            });
            // updateActiveState(0); // positionItem ya lo hace
        }

        // Posiciona un item en el círculo 3D horizontal
        function positionItem(item, index, radius, currentPlateYRotation, isActive) {
            const itemAngle = anglePerItem * index;
            const scale = isActive ? itemActiveScale : itemBaseScale;
            const raiseZ = isActive ? itemActiveRaiseZ : 0;

            // Transformación 3D
            const itemTransform = `
                rotateY(${itemAngle}deg)
                translateZ(${radius + raiseZ}px)
                scale(${scale})
            `;

            // Aplicar transición solo si no se está arrastrando
            item.style.transition = isDragging ? 'none' : `transform ${snapTransitionDuration} ease, opacity ${snapTransitionDuration} ease`;
            item.style.transform = itemTransform;

            // Actualizar opacidad y z-index
            const effectiveItemAngle = (itemAngle + currentPlateYRotation) % 360;
            const angleRad = effectiveItemAngle * (Math.PI / 180);
            const cosAngle = Math.cos(angleRad);
            const opacityFactor = (cosAngle + 1) / 2;
            const minOpacity = 0.4;
            const opacity = minOpacity + (1 - minOpacity) * Math.pow(opacityFactor, 1.5);
            item.style.opacity = opacity.toFixed(2);
            item.style.zIndex = isActive ? itemCount + 1 : Math.round(1 + cosAngle * itemCount);

            item.classList.toggle('active', isActive);
        }

        // Actualiza TODOS los items, determinando cuál está activo
        function updateItemsState(currentPlateYRotation) {
            // No es necesario recalcular radio aquí si no cambia el tamaño de ventana
            // radius = calculateRadius();

            let closestIndex = 0;
            let minDiff = 360;
            const normalizedRotation = (currentPlateYRotation % 360 + 360) % 360;

            items.forEach((item, index) => {
                const itemTargetAngle = (anglePerItem * index + 360) % 360;
                let diff = Math.abs(itemTargetAngle - (-normalizedRotation % 360 + 360) % 360);
                diff = Math.min(diff, 360 - diff);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestIndex = index;
                }
            });
            currentIndex = closestIndex;

            items.forEach((item, index) => {
                positionItem(item, index, radius, currentPlateYRotation, index === currentIndex);
            });
        }

        // Aplica rotación SOLO al plato invisible y actualiza items
        function applyPlateRotation(yRotation, useTransition = false) {
            plate.style.transition = useTransition ? `transform ${snapTransitionDuration} cubic-bezier(0.68, -0.55, 0.27, 1.55)` : 'none';
            plate.style.transform = `rotateY(${yRotation}deg)`;

            // Actualizar estado visual de los items
            updateItemsState(yRotation);
        }


        // --- Eventos de Arrastre (Sin cambios) ---
        function onPointerDown(event) {
            if (event.button !== 0 && event.pointerType === 'mouse') return;
            isDragging = true;
            startX = event.pageX || event.touches[0].pageX;
            startRotationY = currentRotationY;
            plate.style.transition = 'none';
            items.forEach(item => item.style.transition = 'none');
            carouselContainer.classList.add('is-dragging');
            event.preventDefault();
            document.addEventListener('pointermove', onPointerMove, { passive: false });
            document.addEventListener('pointerup', onPointerUp);
            document.addEventListener('pointerleave', onPointerUp);
        }

        function onPointerMove(event) {
            if (!isDragging) return;
            event.preventDefault();
            currentX = event.pageX || event.touches[0].pageX;
            const deltaX = currentX - startX;
            const rotationChange = deltaX * dragSensitivity;
            currentRotationY = startRotationY + rotationChange;
            applyPlateRotation(currentRotationY, false);
        }

        function onPointerUp(event) {
            if (!isDragging) return;
            isDragging = false;
            carouselContainer.classList.remove('is-dragging');
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
            document.removeEventListener('pointerleave', onPointerUp);

            // Snap Logic
            const closestIndexRaw = Math.round(-currentRotationY / anglePerItem);
            currentIndex = (closestIndexRaw % itemCount + itemCount) % itemCount;
            const targetRotationY = -currentIndex * anglePerItem;
            currentRotationY = targetRotationY;
            applyPlateRotation(targetRotationY, true);

            // Reactivar transición items
            setTimeout(() => {
                items.forEach(item => {
                    item.style.transition = `transform ${snapTransitionDuration} ease, opacity ${snapTransitionDuration} ease`;
                });
            }, parseFloat(snapTransitionDuration) * 1000 + 50);
        }

        // --- Event Listener Inicial y Setup ---
        carouselContainer.addEventListener('pointerdown', onPointerDown, { passive: true });
        setupCarousel();
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(setupCarousel, 250); // Llama a setup para recalcular radio
        });

    } else {
        console.error("Error al inicializar el carrusel: Elementos no encontrados.");
    }
    // --- FIN: Lógica del Carrusel Giratorio ---

});
// --- END OF MODIFIED script.js ---