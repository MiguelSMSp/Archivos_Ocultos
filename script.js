
const contenido = document.getElementById("contenido-extra");
const boton = document.getElementById("botonLeer");

boton.addEventListener("click", function() {

    if (contenido.hidden) {
        contenido.hidden = false;
        boton.textContent = "Leer menos";
    } else {
        contenido.hidden = true;
        boton.textContent = "Leer más";
    }

});
