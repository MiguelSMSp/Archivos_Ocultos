
// BOTONES LEER MAS Y LEER MENOS

const tarjetas = document.querySelectorAll(".tarjeta");

tarjetas.forEach(function(tarjeta) {

    const boton = tarjeta.querySelector(".boton");
    const contenido = tarjeta.querySelector(".contenido-extra");

    boton.addEventListener("click", function() {

        if (contenido.hidden) {
            contenido.hidden = false;
            boton.textContent = "Leer menos";
        } else {
            contenido.hidden = true;
            boton.textContent = "Leer más";
        }

    });

});


// FILTRAR NOTICIAS POR ETIQUETAS

const etiquetas = document.querySelectorAll(".etiqueta");

const avisoFiltro = document.getElementById("avisoFiltro");
const limpiarFiltro = document.getElementById("limpiarFiltro");

etiquetas.forEach(function(etiqueta) {

    etiqueta.addEventListener("click", function() {

        const seleccionada = etiqueta.dataset.etiqueta;

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

        avisoFiltro.textContent = "Noticias relacionadas con: " + etiqueta.textContent;
        avisoFiltro.hidden = false;
        limpiarFiltro.hidden = false;

    });

});


// MOSTRAR TODAS LAS NOTICIAS

limpiarFiltro.addEventListener("click", function() {

    tarjetas.forEach(function(tarjeta) {
        tarjeta.hidden = false;
    });

    avisoFiltro.hidden = true;
    limpiarFiltro.hidden = true;

});
