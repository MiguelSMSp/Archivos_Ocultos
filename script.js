
 // Configurar las secciones que contienen noticias
const seccionesNoticias = [
    { archivo: "ovnis.html", nombre: "OVNIS" },
    { archivo: "conspiraciones.html", nombre: "Conspiraciones" },
    { archivo: "enigmas.html", nombre: "Enigmas del pasado" }
];

let navegacionActual = 0;


// Normalizar los identificadores de etiquetas
function normalizarEtiqueta(valor) {

    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

}


// Obtener el identificador de cualquier etiqueta
function obtenerIdentificadorEtiqueta(boton) {

    return normalizarEtiqueta(
        boton.getAttribute("data-etiqueta") || boton.textContent
    );

}


// Preparar el reproductor sin reiniciar el audio al navegar
function iniciarReproductor() {

    const marcador = document.querySelector(".musica");

    if (!marcador) {
        return;
    }

    const reproductor = document.createElement("div");
    reproductor.className = "musica";

    const audio = document.createElement("audio");

    audio.src = new URL(
        "audio/musica-ambiental.mp3",
        document.baseURI
    ).href;

    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = "none";

    // Crear el encabezado del reproductor
    const encabezado = document.createElement("div");
    encabezado.className = "musica-encabezado";

    const boton = document.createElement("button");
    boton.className = "boton-musica";
    boton.type = "button";
    boton.textContent = "▶";
    boton.title = "Reproducir música";
    boton.setAttribute("aria-label", "Reproducir música");

    const titulo = document.createElement("span");
    titulo.textContent = "Música ambiental 🎵";

    encabezado.append(boton, titulo);

    // Crear los controles de volumen
    const controles = document.createElement("div");
    controles.className = "controles-volumen";

    const etiqueta = document.createElement("label");
    etiqueta.textContent = "Volumen";
    etiqueta.htmlFor = "volumen-musica";

    const volumen = document.createElement("input");
    volumen.id = "volumen-musica";
    volumen.type = "range";
    volumen.min = "0";
    volumen.max = "100";
    volumen.value = "35";

    const porcentaje = document.createElement("span");
    porcentaje.textContent = "35%";

    controles.append(etiqueta, volumen, porcentaje);

    reproductor.append(encabezado, controles, audio);
    marcador.replaceWith(reproductor);

    // Reproducir y pausar sin reiniciar la canción
    boton.addEventListener("click", async function() {

        if (audio.paused) {

            try {
                await audio.play();
            } catch (error) {
                console.error(
                    "No se pudo reproducir la música:",
                    error
                );
            }

        } else {
            audio.pause();
        }

    });

    // Actualizar el botón al reproducir
    audio.addEventListener("play", function() {

        boton.textContent = "⏸";
        boton.title = "Pausar música";
        boton.setAttribute("aria-label", "Pausar música");

    });

    // Actualizar el botón al pausar
    audio.addEventListener("pause", function() {

        boton.textContent = "▶";
        boton.title = "Reproducir música";
        boton.setAttribute("aria-label", "Reproducir música");

    });

    // Ajustar el volumen
    volumen.addEventListener("input", function() {

        audio.volume = Number(volumen.value) / 100;
        porcentaje.textContent = volumen.value + "%";

    });

}


// Obtener todas las noticias de las tres secciones
async function obtenerTodasLasNoticias() {

    return Promise.all(

        seccionesNoticias.map(async function(seccion) {

            // Obtener la dirección de la sección
            const url = new URL(
                seccion.archivo,
                document.baseURI
            );

            // Descargar la versión actual del archivo
            const respuesta = await fetch(url, {
                cache: "no-store"
            });

            if (!respuesta.ok) {
                throw new Error(
                    "No se pudo abrir " + seccion.archivo
                );
            }

            const html = await respuesta.text();

            // Convertir el HTML en un documento
            const pagina = new DOMParser().parseFromString(
                html,
                "text/html"
            );

            // Recuperar todos los artículos
            return {
                nombre: seccion.nombre,
                articulos: Array.from(
                    pagina.querySelectorAll("article.tarjeta")
                )
            };

        })

    );

}


// Mostrar exclusivamente las noticias con la etiqueta seleccionada
async function mostrarResultadosEtiqueta(solicitud) {

    const resultados = document.getElementById(
        "resultadosEtiquetas"
    );

    const titulo = document.getElementById(
        "tituloEtiqueta"
    );

    const estado = document.getElementById(
        "estadoEtiquetas"
    );

    if (!resultados || !titulo || !estado) {
        return;
    }

    // Obtener la etiqueta seleccionada
    const parametros = new URLSearchParams(
        window.location.search
    );

    const valor = parametros.get("etiqueta");
    const buscada = normalizarEtiqueta(valor);

    resultados.replaceChildren();
    titulo.textContent = "Noticias relacionadas";

    if (!buscada) {

        estado.textContent =
            "Selecciona una etiqueta de cualquier noticia.";

        return;
    }

    estado.textContent =
        "Buscando noticias en todas las secciones...";

    try {

        // Consultar todas las secciones del blog
        const paginas = await obtenerTodasLasNoticias();

        if (solicitud !== navegacionActual) {
            return;
        }

        const fragmento = document.createDocumentFragment();

        let cantidad = 0;
        let etiquetaVisible = String(valor).replace(
            /[-_]/g,
            " "
        );

        paginas.forEach(function(pagina) {

            pagina.articulos.forEach(function(articulo) {

                // Obtener todas las etiquetas del artículo
                const etiquetas = Array.from(
                    articulo.querySelectorAll(".etiqueta")
                );

                // Buscar coincidencia exacta con la etiqueta
                const coincidencia = etiquetas.find(
                    function(etiqueta) {

                        return obtenerIdentificadorEtiqueta(
                            etiqueta
                        ) === buscada;

                    }
                );

                // Ignorar cualquier artículo sin la etiqueta
                if (!coincidencia) {
                    return;
                }

                etiquetaVisible = coincidencia.textContent.trim();

                // Copiar el artículo coincidente
                const copia = articulo.cloneNode(true);

                // Mostrar la sección de origen
                const origen = document.createElement("p");

                origen.textContent =
                    "Sección: " + pagina.nombre;

                copia.prepend(origen);

                // Mantener la noticia cerrada inicialmente
                const contenido = copia.querySelector(
                    ".contenido-extra"
                );

                if (contenido) {
                    contenido.hidden = true;
                }

                // Conservar el botón Leer más
                const boton = copia.querySelector(".boton");

                if (boton) {
                    boton.textContent = "Leer más";
                }

                // Añadir la noticia a los resultados
                fragmento.append(copia);

                cantidad++;

            });

        });

        // Mostrar todos los artículos coincidentes
        resultados.replaceChildren(fragmento);

        titulo.textContent =
            "Etiqueta: " + etiquetaVisible;

        // Mostrar el número de noticias encontradas
        if (cantidad === 1) {

            estado.textContent =
                "Se ha encontrado 1 noticia con esta etiqueta.";

        } else {

            estado.textContent =
                "Se han encontrado " + cantidad +
                " noticias con esta etiqueta.";

        }

    } catch (error) {

        if (solicitud !== navegacionActual) {
            return;
        }

        console.error(error);

        estado.textContent =
            "No se pudieron consultar todas las secciones. " +
            "Comprueba Live Server y la consola.";

    }

}


// Navegar entre páginas sin detener el reproductor
async function cargarPagina(direccion, guardarHistorial) {

    const solicitud = ++navegacionActual;

    try {

        // Descargar la página seleccionada
        const respuesta = await fetch(direccion, {
            cache: "no-store"
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar la página.");
        }

        const html = await respuesta.text();

        if (solicitud !== navegacionActual) {
            return;
        }

        // Convertir el HTML en un documento
        const pagina = new DOMParser().parseFromString(
            html,
            "text/html"
        );

        const cabecera = document.querySelector(
            ".cabecera"
        );

        if (!cabecera || !pagina.querySelector(".cabecera")) {
            throw new Error("No se encontró la cabecera.");
        }

        // Obtener el contenido actual
        const anteriores = Array.from(
            document.body.children
        ).filter(function(elemento) {

            return elemento !== cabecera &&
                elemento.tagName !== "SCRIPT";

        });

        // Obtener el contenido nuevo
        const nuevos = Array.from(
            pagina.body.children
        ).filter(function(elemento) {

            return !elemento.classList.contains("cabecera") &&
                elemento.tagName !== "SCRIPT";

        });

        // Eliminar el contenido anterior
        anteriores.forEach(function(elemento) {
            elemento.remove();
        });

        // Insertar el contenido nuevo
        cabecera.after(...nuevos);

        document.title = pagina.title;

        // Actualizar la dirección del navegador
        if (guardarHistorial) {
            history.pushState({}, "", direccion);
        }

        window.scrollTo(0, 0);

        // Cargar los resultados de etiquetas
        if (document.getElementById("resultadosEtiquetas")) {

            await mostrarResultadosEtiqueta(solicitud);

        }

    } catch (error) {

        if (solicitud !== navegacionActual) {
            return;
        }

        console.error(error);
        window.location.href = direccion;

    }

}


// Gestionar los botones, las etiquetas y el menú
document.addEventListener("click", function(evento) {

    if (!(evento.target instanceof Element)) {
        return;
    }

    // Gestionar Leer más y Leer menos
    const botonLeer = evento.target.closest(
        ".tarjeta .boton"
    );

    if (botonLeer) {

        const contenido = botonLeer.closest(
            ".tarjeta"
        ).querySelector(".contenido-extra");

        if (!contenido) {
            return;
        }

        contenido.hidden = !contenido.hidden;

        botonLeer.textContent = contenido.hidden
            ? "Leer más"
            : "Leer menos";

        return;
    }

    // Gestionar cualquier etiqueta actual o futura
    const etiqueta = evento.target.closest(".etiqueta");

    if (etiqueta) {

        const identificador = obtenerIdentificadorEtiqueta(
            etiqueta
        );

        if (!identificador) {
            return;
        }

        // Crear la dirección del filtro global
        const destino = new URL(
            "etiquetas.html",
            document.baseURI
        );

        destino.searchParams.set(
            "etiqueta",
            identificador
        );

        // Abrir los resultados sin detener la música
        cargarPagina(destino.href, true);

        return;
    }

    // Gestionar los enlaces del menú
    const enlace = evento.target.closest(
        ".cabecera nav a"
    );

    if (!enlace) {
        return;
    }

    // Respetar los clics especiales del navegador
    if (
        evento.button !== 0 ||
        evento.ctrlKey ||
        evento.metaKey ||
        evento.shiftKey ||
        evento.altKey ||
        enlace.target === "_blank"
    ) {
        return;
    }

    const destino = new URL(enlace.href);

    if (destino.origin !== window.location.origin) {
        return;
    }

    evento.preventDefault();

    if (destino.href !== window.location.href) {
        cargarPagina(destino.href, true);
    }

});


// Mantener el historial del navegador
window.addEventListener("popstate", function() {

    cargarPagina(window.location.href, false);

});


// Iniciar el reproductor y la búsqueda inicial
iniciarReproductor();

if (document.getElementById("resultadosEtiquetas")) {

    mostrarResultadosEtiqueta(navegacionActual);

}
