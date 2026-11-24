
 // Configurar las secciones del blog
const seccionesNoticias = [
    { archivo: "ovnis.html", nombre: "OVNIS" },
    { archivo: "conspiraciones.html", nombre: "Conspiraciones" },
    { archivo: "enigmas.html", nombre: "Enigmas del pasado" }
];

const raizBlog = new URL(".", document.currentScript.src);
let navegacionActual = 0;

// Normalizar las etiquetas para compararlas
function normalizarEtiqueta(valor) {
    return String(valor || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function identificarEtiqueta(boton) {
    return normalizarEtiqueta(boton.dataset.etiqueta || boton.textContent);
}

// Crear los controles del reproductor
function iniciarReproductor() {
    const marcador = document.querySelector(".musica");
    if (!marcador) return;

    const reproductor = document.createElement("div");
    reproductor.className = "musica";

    reproductor.innerHTML = `
        <div class="musica-encabezado">
            <button class="boton-musica" type="button" aria-label="Reproducir música">▶</button>
            <span>Música ambiental 🎵</span>
        </div>
        <div class="controles-volumen">
            <label for="volumen-musica">Volumen</label>
            <input id="volumen-musica" type="range" min="0" max="100" value="35">
            <span>35%</span>
        </div>
        <audio></audio>
    `;

    marcador.replaceWith(reproductor);

    const audio = reproductor.querySelector("audio");
    const boton = reproductor.querySelector(".boton-musica");
    const volumen = reproductor.querySelector("#volumen-musica");
    const porcentaje = reproductor.querySelector(".controles-volumen span");

    audio.src = new URL("audio/musica-ambiental.mp3", raizBlog).href;
    audio.loop = true;
    audio.volume = 0.35;
    audio.preload = "none";

    // Reproducir y pausar sin reiniciar el audio
    boton.addEventListener("click", async () => {
        if (!audio.paused) {
            audio.pause();
            return;
        }

        try {
            await audio.play();
        } catch (error) {
            console.error("No se pudo reproducir la música:", error);
        }
    });

    // Actualizar el botón de reproducción
    function actualizarBoton() {
        boton.textContent = audio.paused ? "▶" : "⏸";
        boton.title = audio.paused ? "Reproducir música" : "Pausar música";
        boton.setAttribute("aria-label", boton.title);
    }

    audio.addEventListener("play", actualizarBoton);
    audio.addEventListener("pause", actualizarBoton);
    actualizarBoton();

    // Ajustar el volumen
    volumen.addEventListener("input", () => {
        audio.volume = Number(volumen.value) / 100;
        porcentaje.textContent = volumen.value + "%";
    });
}

// Obtener las noticias de todas las secciones
async function obtenerNoticias() {
    return Promise.all(seccionesNoticias.map(async (seccion) => {
        const url = new URL(seccion.archivo, raizBlog);
        const respuesta = await fetch(url, { cache: "no-store" });

        if (!respuesta.ok) {
            throw new Error("No se pudo abrir " + seccion.archivo);
        }

        const pagina = new DOMParser().parseFromString(
            await respuesta.text(),
            "text/html"
        );

        return {
            nombre: seccion.nombre,
            articulos: [...pagina.querySelectorAll(".tarjeta")]
        };
    }));
}

// Filtrar las noticias exclusivamente por etiquetas
async function mostrarResultadosEtiqueta(solicitud) {
    const resultados = document.getElementById("resultadosEtiquetas");
    const titulo = document.getElementById("tituloEtiqueta");
    const estado = document.getElementById("estadoEtiquetas");

    if (!resultados || !titulo || !estado) return;

    const valor = new URLSearchParams(location.search).get("etiqueta");
    const buscada = normalizarEtiqueta(valor);

    resultados.replaceChildren();
    titulo.textContent = "Noticias relacionadas";

    if (!buscada) {
        estado.textContent = "Selecciona una etiqueta de cualquier noticia.";
        return;
    }

    estado.textContent = "Buscando noticias...";

    try {
        const paginas = await obtenerNoticias();
        if (solicitud !== navegacionActual) return;

        const fragmento = document.createDocumentFragment();
        let cantidad = 0;
        let nombreEtiqueta = valor.replace(/[-_]/g, " ");

        for (const pagina of paginas) {
            for (const tarjeta of pagina.articulos) {

                // Comprobar las etiquetas del artículo
                const coincidencia = [...tarjeta.querySelectorAll(".etiqueta")]
                    .find((boton) => identificarEtiqueta(boton) === buscada);

                if (!coincidencia) continue;

                // Copiar la noticia coincidente
                const copia = tarjeta.cloneNode(true);
                const origen = document.createElement("p");

                origen.textContent = "Sección: " + pagina.nombre;
                copia.prepend(origen);

                // Conservar Leer más y Leer menos
                const contenido = copia.querySelector(".contenido-extra");
                const botonLeer = copia.querySelector(".boton");

                if (contenido) contenido.hidden = true;
                if (botonLeer) botonLeer.textContent = "Leer más";

                nombreEtiqueta = coincidencia.textContent.trim();
                fragmento.append(copia);
                cantidad++;
            }
        }

        // Mostrar las noticias encontradas
        resultados.replaceChildren(fragmento);

        titulo.textContent = "Etiqueta: " + nombreEtiqueta;

        estado.textContent = "Se han encontrado " + cantidad +
            " noticias con esta etiqueta.";

    } catch (error) {
        if (solicitud !== navegacionActual) return;

        console.error(error);
        estado.textContent =
            "No se pudieron cargar las noticias. Comprueba Live Server.";
    }
}

// Cambiar de página sin detener el reproductor
async function cargarPagina(direccion, guardarHistorial) {
    const solicitud = ++navegacionActual;

    try {
        const respuesta = await fetch(direccion, { cache: "no-store" });

        if (!respuesta.ok) {
            throw new Error("No se pudo abrir la página.");
        }

        const pagina = new DOMParser().parseFromString(
            await respuesta.text(),
            "text/html"
        );

        if (solicitud !== navegacionActual) return;

        const cabecera = document.querySelector(".cabecera");

        if (!cabecera || !pagina.querySelector(".cabecera")) {
            throw new Error("No se encontró la cabecera.");
        }

        // Seleccionar el contenido nuevo
        const nuevos = [...pagina.body.children].filter((elemento) =>
            !elemento.classList.contains("cabecera") &&
            elemento.tagName !== "SCRIPT"
        );

        // Eliminar el contenido anterior
        [...document.body.children]
            .filter((elemento) =>
                elemento !== cabecera && elemento.tagName !== "SCRIPT"
            )
            .forEach((elemento) => elemento.remove());

        // Insertar el contenido nuevo
        cabecera.after(...nuevos);
        document.title = pagina.title;

        if (guardarHistorial) {
            history.pushState({}, "", direccion);
        }

        window.scrollTo(0, 0);

        // Mostrar las noticias filtradas cuando corresponda
        if (document.getElementById("resultadosEtiquetas")) {
            await mostrarResultadosEtiqueta(solicitud);
        }

    } catch (error) {
        if (solicitud !== navegacionActual) return;

        console.error(error);
        location.href = direccion;
    }
}

// Gestionar los botones y enlaces del blog
document.addEventListener("click", (evento) => {
    if (!(evento.target instanceof Element)) return;

    // Gestionar Leer más y Leer menos
    const botonLeer = evento.target.closest(".tarjeta .boton");

    if (botonLeer) {
        const contenido = botonLeer.closest(".tarjeta")
            .querySelector(".contenido-extra");

        if (!contenido) return;

        contenido.hidden = !contenido.hidden;

        botonLeer.textContent = contenido.hidden
            ? "Leer más"
            : "Leer menos";

        return;
    }

    // Respetar los enlaces gestionados desde Inicio
    if (evento.defaultPrevented) return;

    // Gestionar las etiquetas actuales y futuras
    const etiqueta = evento.target.closest(".etiqueta");

    if (etiqueta) {
        const identificador = identificarEtiqueta(etiqueta);
        if (!identificador) return;

        const destino = new URL("etiquetas.html", raizBlog);
        destino.searchParams.set("etiqueta", identificador);

        cargarPagina(destino.href, true);
        return;
    }

    // Gestionar los enlaces del menú y de Inicio
    const enlace = evento.target.closest(
        ".cabecera nav a, a[data-navegacion]"
    );

    if (!enlace ||
        evento.button !== 0 ||
        evento.ctrlKey ||
        evento.metaKey ||
        evento.shiftKey ||
        evento.altKey ||
        enlace.target === "_blank") {
        return;
    }

    const destino = new URL(enlace.href);

    if (destino.origin !== location.origin) return;

    evento.preventDefault();

    if (destino.href !== location.href) {
        cargarPagina(destino.href, true);
    }
});

// Permitir navegar con Atrás y Adelante
window.addEventListener("popstate", () => {
    cargarPagina(location.href, false);
});

// Iniciar el reproductor y cargar los resultados
iniciarReproductor();

if (document.getElementById("resultadosEtiquetas")) {
    mostrarResultadosEtiqueta(navegacionActual);
}
