
// Configurar el reproductor de música ambiental

const reproductorAntiguo = document.querySelector(".musica");

if (reproductorAntiguo) {

    // Crear el nuevo reproductor fijo
    const reproductor = document.createElement("div");
    reproductor.className = "musica";

    // Crear el archivo de audio
    const audio = document.createElement("audio");

    audio.src = "audio/musica-ambiental.mp3";
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = "none";

    // Crear la primera fila
    const encabezadoMusica = document.createElement("div");
    encabezadoMusica.className = "musica-encabezado";

    // Crear el botón Play / Pausa
    const botonMusica = document.createElement("button");

    botonMusica.className = "boton-musica";
    botonMusica.type = "button";
    botonMusica.textContent = "▶";
    botonMusica.title = "Reproducir música";
    botonMusica.setAttribute("aria-label", "Reproducir música");

    // Crear el título del reproductor
    const tituloMusica = document.createElement("span");
    tituloMusica.textContent = "Música ambiental 🎵";

    encabezadoMusica.append(botonMusica, tituloMusica);

    // Crear el control de volumen
    const controlesVolumen = document.createElement("div");
    controlesVolumen.className = "controles-volumen";

    const etiquetaVolumen = document.createElement("label");
    etiquetaVolumen.textContent = "Volumen";
    etiquetaVolumen.htmlFor = "volumen-musica";

    const barraVolumen = document.createElement("input");

    barraVolumen.type = "range";
    barraVolumen.id = "volumen-musica";
    barraVolumen.min = "0";
    barraVolumen.max = "100";
    barraVolumen.value = "35";

    const porcentaje = document.createElement("span");
    porcentaje.textContent = "35%";

    controlesVolumen.append(
        etiquetaVolumen,
        barraVolumen,
        porcentaje
    );

    // Introducir los elementos en el reproductor
    reproductor.append(
        encabezadoMusica,
        controlesVolumen,
        audio
    );

    // Sustituir el reproductor anterior
    reproductorAntiguo.replaceWith(reproductor);

    // Reproducir y pausar la música
    botonMusica.addEventListener("click", async function() {

        if (audio.paused) {

            try {
                await audio.play();
            } catch (error) {
                console.error(error);
                alert("No se pudo reproducir la música.");
            }

        } else {

            audio.pause();

        }

    });

    // Cambiar el icono al reproducir
    audio.addEventListener("play", function() {

        botonMusica.textContent = "⏸";
        botonMusica.title = "Pausar música";
        botonMusica.setAttribute("aria-label", "Pausar música");

    });

    // Cambiar el icono al pausar
    audio.addEventListener("pause", function() {

        botonMusica.textContent = "▶";
        botonMusica.title = "Reproducir música";
        botonMusica.setAttribute("aria-label", "Reproducir música");

    });

    // Controlar el volumen
    barraVolumen.addEventListener("input", function() {

        audio.volume = Number(barraVolumen.value) / 100;

        porcentaje.textContent = barraVolumen.value + "%";

    });

}


// Mostrar y ocultar el contenido de las noticias

document.addEventListener("click", function(evento) {

    const boton = evento.target.closest(".tarjeta .boton");

    if (!boton) {
        return;
    }

    const tarjeta = boton.closest(".tarjeta");
    const contenido = tarjeta.querySelector(".contenido-extra");

    if (contenido.hidden) {

        contenido.hidden = false;
        boton.textContent = "Leer menos";

    } else {

        contenido.hidden = true;
        boton.textContent = "Leer más";

    }

});


// Filtrar noticias por etiquetas

document.addEventListener("click", function(evento) {

    const etiqueta = evento.target.closest(".etiqueta");

    if (!etiqueta) {
        return;
    }

    const seleccionada = etiqueta.dataset.etiqueta;

    const tarjetas = document.querySelectorAll(".tarjeta");

    tarjetas.forEach(function(tarjeta) {

        const etiquetasNoticia = tarjeta.querySelectorAll(".etiqueta");

        let coincide = false;

        etiquetasNoticia.forEach(function(otraEtiqueta) {

            if (otraEtiqueta.dataset.etiqueta === seleccionada) {
                coincide = true;
            }

        });

        tarjeta.hidden = !coincide;

    });

    // Mostrar el filtro seleccionado
    const aviso = document.getElementById("avisoFiltro");
    const limpiar = document.getElementById("limpiarFiltro");

    aviso.textContent = "Noticias relacionadas con: " + etiqueta.textContent;
    aviso.hidden = false;
    limpiar.hidden = false;

});


// Mostrar todas las noticias

document.addEventListener("click", function(evento) {

    const boton = evento.target.closest("#limpiarFiltro");

    if (!boton) {
        return;
    }

    const tarjetas = document.querySelectorAll(".tarjeta");

    tarjetas.forEach(function(tarjeta) {
        tarjeta.hidden = false;
    });

    // Ocultar el aviso del filtro
    document.getElementById("avisoFiltro").hidden = true;
    boton.hidden = true;

});


// Cargar las secciones sin recargar la página

async function cargarSeccion(direccion, guardarHistorial) {

    try {

        // Obtener el HTML de la nueva sección
        const respuesta = await fetch(direccion);

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar la página");
        }

        const codigoHTML = await respuesta.text();

        // Convertir el HTML en un documento
        const parser = new DOMParser();

        const paginaNueva = parser.parseFromString(
            codigoHTML,
            "text/html"
        );

        // Localizar la cabecera actual
        const cabecera = document.querySelector(".cabecera");

        if (!cabecera || !paginaNueva.querySelector(".cabecera")) {
            throw new Error("No se encontró la cabecera");
        }

        // Seleccionar el contenido actual
        const contenidoActual = Array.from(document.body.children)
            .filter(function(elemento) {

                return elemento !== cabecera
                    && elemento.tagName !== "SCRIPT";

            });

        // Seleccionar el contenido de la nueva página
        const contenidoNuevo = Array.from(paginaNueva.body.children)
            .filter(function(elemento) {

                return !elemento.classList.contains("cabecera")
                    && elemento.tagName !== "SCRIPT";

            });

        // Eliminar el contenido anterior
        contenidoActual.forEach(function(elemento) {
            elemento.remove();
        });

        // Insertar el contenido nuevo
        cabecera.after(...contenidoNuevo);

        // Actualizar el título de la página
        document.title = paginaNueva.title;

        // Actualizar el historial del navegador
        if (guardarHistorial) {
            history.pushState({}, "", direccion);
        }

        // Volver al principio de la página
        window.scrollTo(0, 0);

    } catch (error) {

        console.error(error);

        // Utilizar la navegación normal si ocurre un error
        window.location.href = direccion;

    }

}


// Gestionar los enlaces del menú

document.addEventListener("click", function(evento) {

    const enlace = evento.target.closest(".cabecera nav a");

    if (!enlace) {
        return;
    }

    // Permitir abrir enlaces en otras pestañas
    if (evento.ctrlKey || evento.metaKey ||
        evento.shiftKey || evento.altKey ||
        evento.button !== 0 ||
        enlace.target === "_blank") {
        return;
    }

    // Comprobar que el enlace pertenece a nuestra web
    const destino = new URL(enlace.href);

    if (destino.origin !== window.location.origin) {
        return;
    }

    // Evitar la recarga completa
    evento.preventDefault();

    if (destino.href === window.location.href) {
        return;
    }

    // Cargar la sección seleccionada
    cargarSeccion(destino.href, true);

});


// Permitir navegar hacia atrás y adelante

window.addEventListener("popstate", function() {

    cargarSeccion(window.location.href, false);

});
