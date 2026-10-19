
/* ==========================================
   MOMENTOS DE INERCIA - CIV 2202D
   PLANO CARTESIANO INTERACTIVO
========================================== */

document.addEventListener("DOMContentLoaded", function () {

    // =====================================
    // ELEMENTOS PRINCIPALES
    // =====================================

    const canvas = document.getElementById("plano");
    const ctx = canvas.getContext("2d");

// Control para mostrar u ocultar el centroide G
const casillaCentroideGlobal =
    document.getElementById("mostrarCentroideGlobal");

    // Escala: pixeles por unidad
    let escala = 50;

    const escalaMinima = 0.00000001;
    const escalaMaxima = 50000;

    // Centro de la vista
    let centroVistaX = 0;
    let centroVistaY = 0;

    // Origen de los ejes de referencia
    let origenReferenciaX = 0;
    let origenReferenciaY = 0;

    // Puntos registrados
    const puntos = [];

    // =====================================
    // FIGURAS GEOMETRICAS GUARDADAS
    // =====================================

    const figurasGuardadas = [];

    // Punto utilizado actualmente como origen
    let puntoOrigenActivo = null;

    // Estado del contorno de la figura
    let figuraCerrada = false;

    // Control del desplazamiento de vista
    let arrastrando = false;
    let anteriorX = 0;
    let anteriorY = 0;

    canvas.style.cursor = "grab";
    canvas.style.touchAction = "none";

    // =====================================
    // ELEMENTOS DE LA INTERFAZ
    // =====================================

    const inputX = document.getElementById("coordX");
    const inputY = document.getElementById("coordY");

    const botonAgregar =
        document.getElementById("agregarPunto");

    // Boton para agregar puntos con el mouse
    const botonAgregarPuntoMouse =
        document.getElementById("agregarPuntoMouse");

    // Control del modo de agregar puntos
    let modoPuntosMouse = false;

    // Control para distinguir clic y arrastre
    let inicioClicX = 0;
    let inicioClicY = 0;
    let huboArrastreMouse = false;

    const botonCerrar =
        document.getElementById("cerrarFigura");

    const listaPuntos =
        document.getElementById("listaPuntos");

      const botonEstablecer =
        document.getElementById("establecerOrigen");

    // Campos para mover el origen
    const inputOrigenX =
        document.getElementById("origenX");

    const inputOrigenY =
        document.getElementById("origenY");

    // Movimiento manual del origen
    const botonMoverOrigen =
        document.getElementById("modoMoverOrigen");

    let modoMoverOrigenManual = false;

    const botonRestablecer =
        document.getElementById("restablecerOrigen");

    const textoOrigen =
        document.getElementById("origenActual");

    // =====================================
    // ELEMENTOS DEL PANEL DE FIGURAS
    // =====================================

    const selectorTipoFigura =
        document.getElementById("tipoFigura");

    const botonGuardarFigura =
        document.getElementById("guardarFigura");

    const listaFiguras =
        document.getElementById("listaFiguras");

    // Elemento para mostrar el area
    const valorArea =
        document.getElementById("valorArea");

    // Elementos del resultado del centroide
    const resultadoCentroideX =
        document.getElementById("centroideX");

    const resultadoCentroideY =
        document.getElementById("centroideY");

    // Resultados de momentos de inercia
    const resultadoInerciaX =
        document.getElementById("inerciaX");

    const resultadoInerciaY =
        document.getElementById("inerciaY");

    const resultadoProductoInercia =
        document.getElementById("productoInercia");

    // =====================================
    // TABLA DE PROPIEDADES GEOMETRICAS
    // =====================================

    const cuerpoTablaGeometrica =
        document.getElementById("cuerpoTablaGeometrica");

    // Resultados respecto a los ejes X - Y

    const resultadoReferenciaX =
        document.getElementById("inerciaReferenciaX");

    const resultadoReferenciaY =
        document.getElementById("inerciaReferenciaY");

    const resultadoProductoReferencia =
        document.getElementById("productoReferencia");

    // =====================================
    // INTERVALO AUTOMATICO
    // =====================================

    function calcularIntervalo() {

        const deseado = 45 / escala;

        const potencia = Math.pow(
            10,
            Math.floor(Math.log10(deseado))
        );

        const valor = deseado / potencia;

        let factor;

        if (valor <= 1) {
            factor = 1;
        } else if (valor <= 2) {
            factor = 2;
        } else if (valor <= 5) {
            factor = 5;
        } else {
            factor = 10;
        }

        return factor * potencia;
    }

    // =====================================
    // FORMATO DE NUMEROS
    // =====================================

    function formatoNumero(numero) {

        if (numero === 0) {
            return "0";
        }

        const valor = Number(
            numero.toPrecision(12)
        );

        if (Math.abs(valor) >= 1e12 ||
            Math.abs(valor) < 1e-6) {
            return valor.toExponential(2);
        }

        return valor.toLocaleString("es-BO", {
            maximumFractionDigits: 10
        });
    }

    // =====================================
    // DIMENSIONES DEL PLANO
    // =====================================

    function obtenerDimensiones() {

        const ancho = canvas.clientWidth;
        const alto = ancho * 0.6;

        return { ancho, alto };
    }

    // =====================================
    // CONVERSION DE COORDENADAS
    // =====================================

    function pantallaX(x, ancho) {

        return ancho / 2 +
            (x - centroVistaX) * escala;
    }

    function pantallaY(y, alto) {

        return alto / 2 -
            (y - centroVistaY) * escala;
    }

    // =====================================
    // DIBUJAR PLANO
    // =====================================

    function dibujarPlano() {

        const { ancho, alto } = obtenerDimensiones();

        if (ancho <= 0) return;

        const dpr = window.devicePixelRatio || 1;

        canvas.width = Math.round(ancho * dpr);
        canvas.height = Math.round(alto * dpr);

        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Fondo blanco
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, ancho, alto);

        // Limites visibles
        const xMin = centroVistaX -
            ancho / (2 * escala);

        const xMax = centroVistaX +
            ancho / (2 * escala);

        const yMin = centroVistaY -
            alto / (2 * escala);

        const yMax = centroVistaY +
            alto / (2 * escala);

        const intervalo = calcularIntervalo();

        // Divisiones respecto al origen actual
        const inicioX = Math.ceil(
            (xMin - origenReferenciaX) / intervalo
        );

        const finX = Math.floor(
            (xMax - origenReferenciaX) / intervalo
        );

        const inicioY = Math.ceil(
            (yMin - origenReferenciaY) / intervalo
        );

        const finY = Math.floor(
            (yMax - origenReferenciaY) / intervalo
        );

        // =====================================
        // CUADRICULA
        // =====================================

        ctx.strokeStyle = "#e2eaf3";
        ctx.lineWidth = 1;

        // Lineas verticales
        for (let i = inicioX; i <= finX; i++) {

            const valor =
                origenReferenciaX + i * intervalo;

            const x = pantallaX(valor, ancho);

            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, alto);
            ctx.stroke();
        }

        // Lineas horizontales
        for (let i = inicioY; i <= finY; i++) {

            const valor =
                origenReferenciaY + i * intervalo;

            const y = pantallaY(valor, alto);

            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(ancho, y);
            ctx.stroke();
        }

        // =====================================
        // EJES DE REFERENCIA
        // =====================================

        const origenX =
            pantallaX(origenReferenciaX, ancho);

        const origenY =
            pantallaY(origenReferenciaY, alto);

        ctx.strokeStyle = "#174b82";
        ctx.lineWidth = 2;

        // Eje X
        if (origenY >= 0 && origenY <= alto) {

            ctx.beginPath();
            ctx.moveTo(0, origenY);
            ctx.lineTo(ancho, origenY);
            ctx.stroke();
        }

        // Eje Y
        if (origenX >= 0 && origenX <= ancho) {

            ctx.beginPath();
            ctx.moveTo(origenX, 0);
            ctx.lineTo(origenX, alto);
            ctx.stroke();
        }

        // =====================================
        // NUMERACION AUTOMATICA
        // =====================================

        ctx.fillStyle = "#34465d";
        ctx.font = "12px Arial";

        const etiquetaY =
            origenY >= 0 && origenY <= alto - 27
                ? origenY + 18
                : alto - 14;

        const etiquetaX =
            origenX >= 40 && origenX <= ancho
                ? origenX - 9
                : 52;

        // Numeros del eje X
        ctx.textAlign = "center";

        for (let i = inicioX; i <= finX; i++) {

            if (i === 0) continue;

            const valor =
                origenReferenciaX + i * intervalo;

            ctx.fillText(
                formatoNumero(i * intervalo),
                pantallaX(valor, ancho),
                etiquetaY
            );
        }

        // Numeros del eje Y
        ctx.textAlign = "right";

        for (let i = inicioY; i <= finY; i++) {

            if (i === 0) continue;

            const valor =
                origenReferenciaY + i * intervalo;

            ctx.fillText(
                formatoNumero(i * intervalo),
                etiquetaX,
                pantallaY(valor, alto) + 4
            );
        }

        // =====================================
        // MARCAR ORIGEN
        // =====================================

        if (
            origenX >= 0 && origenX <= ancho &&
            origenY >= 0 && origenY <= alto
        ) {

            ctx.fillStyle = "#174b82";
            ctx.textAlign = "right";

            ctx.fillText(
                "0",
                origenX - 9,
                origenY + 17
            );

            ctx.beginPath();
            ctx.arc(
                origenX,
                origenY,
                3,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }

        // =====================================
        // NOMBRES DE LOS EJES
        // =====================================

        ctx.fillStyle = "#174b82";
        ctx.font = "bold 14px Arial";

        if (origenY >= 0 && origenY <= alto) {

            ctx.textAlign = "right";

            ctx.fillText(
                "X",
                ancho - 12,
                origenY - 12
            );
        }

        if (origenX >= 0 && origenX <= ancho) {

            ctx.textAlign = "left";

            ctx.fillText(
                "Y",
                origenX + 12,
                18
            );
        }

        // =====================================
        // DIBUJAR FIGURAS GUARDADAS
        // =====================================

        figurasGuardadas.forEach(function (figura, indice) {

            const vertices = figura.puntos;

            if (vertices.length < 3) return;

            ctx.save();
            ctx.beginPath();

            // Primer vertice
            ctx.moveTo(
                pantallaX(vertices[0].x, ancho),
                pantallaY(vertices[0].y, alto)
            );

            // Unir los vertices
            for (let i = 1; i < vertices.length; i++) {

                ctx.lineTo(
                    pantallaX(vertices[i].x, ancho),
                    pantallaY(vertices[i].y, alto)
                );
            }

            // Cerrar el contorno
            ctx.closePath();

            if (figura.signo === 1) {

                // Figura positiva
                ctx.fillStyle = "rgba(40,121,191,0.15)";
                ctx.strokeStyle = "#2879bf";
                ctx.setLineDash([]);

            } else {

                // Figura negativa
                ctx.fillStyle = "rgba(200,63,69,0.12)";
                ctx.strokeStyle = "#c83f45";
                ctx.setLineDash([7, 5]);
            }

            ctx.lineWidth = 2.5;

            ctx.fill();
            ctx.stroke();

            // Identificar la figura
            const primerPunto = vertices[0];

            const px = pantallaX(primerPunto.x, ancho);
            const py = pantallaY(primerPunto.y, alto);

            ctx.fillStyle =
                figura.signo === 1 ? "#174b82" : "#b23b42";

            ctx.font = "bold 12px Arial";
            ctx.textAlign = "left";

            ctx.fillText(
                "F" + (indice + 1) +
                (figura.signo === 1 ? " (+)" : " (-)"),
                px + 8,
                py - 12
            );

            ctx.restore();
        });

        // =====================================
        // UNIR PUNTOS Y CERRAR FIGURA
        // =====================================

        if (puntos.length >= 2) {

            ctx.beginPath();

            // Comenzar en el primer punto
            ctx.moveTo(
                pantallaX(puntos[0].x, ancho),
                pantallaY(puntos[0].y, alto)
            );

            // Unir los puntos consecutivamente
            for (let i = 1; i < puntos.length; i++) {

                ctx.lineTo(
                    pantallaX(puntos[i].x, ancho),
                    pantallaY(puntos[i].y, alto)
                );
            }

            // Cerrar el contorno
            if (figuraCerrada && puntos.length >= 3) {
                ctx.closePath();
            }

            // Dibujar los segmentos
            ctx.strokeStyle = "#2879bf";
            ctx.lineWidth = 2.5;
            ctx.lineJoin = "round";

            ctx.stroke();
        }


        // =====================================
        // DIBUJAR PUNTOS
        // =====================================

        puntos.forEach(function (punto, indice) {

        // =====================================
        // DIBUJAR CENTROIDE G
        // =====================================

        const centroideG = calcularCentroide();

        if (centroideG !== null) {

            // Convertir coordenadas geometricas
            // a coordenadas de pantalla
            const gx = pantallaX(centroideG.x, ancho);
            const gy = pantallaY(centroideG.y, alto);

            // Verificar que este visible
            if (
                gx >= 0 && gx <= ancho &&
                gy >= 0 && gy <= alto
            ) {

                ctx.save();

                // Cruz que identifica el centroide
                ctx.beginPath();
                ctx.moveTo(gx - 12, gy);
                ctx.lineTo(gx + 12, gy);
                ctx.moveTo(gx, gy - 12);
                ctx.lineTo(gx, gy + 12);

                ctx.strokeStyle = "#16846d";
                ctx.lineWidth = 2;
                ctx.stroke();

                // Circulo central
                ctx.beginPath();
                ctx.arc(gx, gy, 7, 0, 2 * Math.PI);

                ctx.fillStyle = "#16a085";
                ctx.fill();

                ctx.strokeStyle = "#ffffff";
                ctx.lineWidth = 2;
                ctx.stroke();

                // Punto blanco interior
                ctx.beginPath();
                ctx.arc(gx, gy, 2, 0, 2 * Math.PI);
                ctx.fillStyle = "#ffffff";
                ctx.fill();

                // Etiqueta G
                ctx.font = "bold 14px Arial";
                ctx.fillStyle = "#16846d";
                ctx.textAlign = "left";

                ctx.fillText(
                    "G",
                    gx + 12,
                    gy - 12
                );

                ctx.restore();
            }
        }

  


            const px = pantallaX(punto.x, ancho);
            const py = pantallaY(punto.y, alto);

            // No dibujar fuera del plano
            if (
                px < 0 || px > ancho ||
                py < 0 || py > alto
            ) {
                return;
            }

            // Punto circular
            ctx.beginPath();

            ctx.arc(
                px,
                py,
                5,
                0,
                Math.PI * 2
            );

            ctx.fillStyle = "#e05236";
            ctx.fill();

            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Nombre del punto
            ctx.font = "bold 12px Arial";
            ctx.fillStyle = "#174b82";
            ctx.textAlign = "left";

            ctx.fillText(
                "P" + (indice + 1),
                px + 9,
                py - 9
            );
        });
        
        // =====================================
        // ACTUALIZAR TABLA Y TOTALES
        // =====================================
// Dibujar centroide global de la seccion compuesta
     
        // =====================================
        // VISUALIZACION DE EJES CENTROIDALES
        // =====================================

        if (casillaEjesCentroidales.checked) {

            dibujarEjesCentroidales(ancho, alto);

        }

        // =====================================
        // MOSTRAR EJES PRINCIPALES DE INERCIA
        // =====================================

        const controlPrincipales =
            document.getElementById(
                "mostrarEjesPrincipales"
            );

        if (
            controlPrincipales &&
            controlPrincipales.checked
        ) {

            dibujarEjesPrincipales(ancho, alto);

        }

        // El centroide global siempre es visible
       
// Mostrar el centroide global si la casilla esta activada
if (casillaCentroideGlobal.checked) {

    dibujarCentroideTotal(ancho, alto);

}


        actualizarTablaGeometrica();
        actualizarTotalesSeccion();

        actualizarInerciasTotales();

             // Actualizar sumatorias individuales
        actualizarSumatoriasTabla();

// Actualizar el circulo de Mohr
dibujarCirculoMohr();

    }

    // =====================================
    // MOSTRAR ORIGEN ACTUAL
    // =====================================

    function actualizarOrigenActual() {

        textoOrigen.textContent =
            "X = " +
            formatoNumero(origenReferenciaX) +
            ", Y = " +
            formatoNumero(origenReferenciaY);
    }

    // =====================================
    // ACTUALIZAR Y ELIMINAR PUNTOS
    // =====================================

    function actualizarListaPuntos() {

        listaPuntos.replaceChildren();
  

   
        if (puntos.length === 0) {

            listaPuntos.textContent =
                "No hay puntos registrados.";

            return;
        }

        puntos.forEach(function (punto, indice) {

            // Fila de cada punto
            const fila = document.createElement("div");
            fila.className = "punto-registrado";

            // Nombre y coordenadas
            const nombre = document.createElement("span");

            nombre.textContent =
                "P" + (indice + 1) +
                " (" + punto.x + ", " + punto.y + ")";

            // Boton eliminar
            const botonEliminar =
                document.createElement("button");

            botonEliminar.type = "button";
            botonEliminar.className =
                "boton-eliminar-punto";

            botonEliminar.textContent = "Eliminar";

            botonEliminar.addEventListener(
                "click",
                function () {

                    const confirmar = confirm(
                        "¿Eliminar el punto P" +
                        (indice + 1) + "?"
                    );

                    if (!confirmar) return;

                    // Si es el origen activo,
                    // restablecer los ejes
                    if (puntoOrigenActivo === punto) {

                        origenReferenciaX = 0;
                        origenReferenciaY = 0;

                        puntoOrigenActivo = null;

                        actualizarOrigenActual();
                    }

                    // Eliminar el punto
                    puntos.splice(indice, 1);

                    // Reabrir el contorno
                    figuraCerrada = false;

                    // Actualizar lista y dibujo
                    actualizarListaPuntos();
                    dibujarPlano();
                }
            );

            fila.appendChild(nombre);
            fila.appendChild(botonEliminar);

            listaPuntos.appendChild(fila);

            // Actualizar selector del origen
            
        });
    }

    // =====================================
    // CALCULAR AREA DEL POLIGONO
    // =====================================

    function calcularAreaPoligono() {

        if (!figuraCerrada || puntos.length < 3) {
            return null;
        }

        let suma = 0;

        for (let i = 0; i < puntos.length; i++) {

            const puntoActual = puntos[i];

            const puntoSiguiente =
                puntos[(i + 1) % puntos.length];

            suma +=
                puntoActual.x * puntoSiguiente.y -
                puntoSiguiente.x * puntoActual.y;
        }

        const area = Math.abs(suma) / 2;

        return area;
    }

    // =====================================
    // MOSTRAR EL AREA CALCULADA
    // =====================================

    function actualizarArea() {

        const area = calcularAreaPoligono();

        if (area === null) {

            valorArea.textContent =
                "Pendiente de calcular";

        } else {

            valorArea.textContent =
                formatoNumero(area) + " u²";
        }
    }

    // =====================================
    // CALCULAR CENTROIDE DEL POLIGONO
    // =====================================

    function calcularCentroide() {

        if (!figuraCerrada || puntos.length < 3) {
            return null;
        }

        let sumaArea = 0;
        let sumaX = 0;
        let sumaY = 0;

        for (let i = 0; i < puntos.length; i++) {

            const actual = puntos[i];

            const siguiente =
                puntos[(i + 1) % puntos.length];

            const producto =
                actual.x * siguiente.y -
                siguiente.x * actual.y;

            sumaArea += producto;

            sumaX +=
                (actual.x + siguiente.x) * producto;

            sumaY +=
                (actual.y + siguiente.y) * producto;
        }

        // Area algebraica
        const areaConSigno = sumaArea / 2;

        // Evitar division entre cero
        if (Math.abs(areaConSigno) < 1e-12) {
            return null;
        }

        const xCentroide =
            sumaX / (6 * areaConSigno);

        const yCentroide =
            sumaY / (6 * areaConSigno);

        return {
            x: xCentroide,
            y: yCentroide
        };
    }

    // =====================================
    // MOSTRAR RESULTADO DEL CENTROIDE
    // =====================================

    function actualizarCentroide() {

        const centroide = calcularCentroide();

        if (centroide === null) {

            resultadoCentroideX.textContent =
                "Pendiente";

            resultadoCentroideY.textContent =
                "Pendiente";

            return;
        }

        // Coordenadas relativas al origen actual
        const xRelativa =
            centroide.x - origenReferenciaX;

        const yRelativa =
            centroide.y - origenReferenciaY;

        resultadoCentroideX.textContent =
            formatoNumero(xRelativa);

        resultadoCentroideY.textContent =
            formatoNumero(yRelativa);
    }

    // =====================================
    // MOMENTOS DE INERCIA CENTROIDALES
    // =====================================

    function calcularInercias() {

        if (!figuraCerrada || puntos.length < 3) {
            return null;
        }

        const centroide = calcularCentroide();

        if (centroide === null) {
            return null;
        }

        let sumaAreaDoble = 0;
        let sumaIx = 0;
        let sumaIy = 0;
        let sumaIxy = 0;

        for (let i = 0; i < puntos.length; i++) {

            const p1 = puntos[i];

            const p2 =
                puntos[(i + 1) % puntos.length];

            const x1 = p1.x;
            const y1 = p1.y;

            const x2 = p2.x;
            const y2 = p2.y;

            const cruz = x1 * y2 - x2 * y1;

            sumaAreaDoble += cruz;

            // Momento respecto al eje X global
            sumaIx += cruz * (
                y1 * y1 +
                y1 * y2 +
                y2 * y2
            );

            // Momento respecto al eje Y global
            sumaIy += cruz * (
                x1 * x1 +
                x1 * x2 +
                x2 * x2
            );

            // Producto de inercia global
            sumaIxy += cruz * (
                2 * x1 * y1 +
                x1 * y2 +
                x2 * y1 +
                2 * x2 * y2
            );
        }

        // Area algebraica
        const areaConSigno = sumaAreaDoble / 2;

        if (Math.abs(areaConSigno) < 1e-12) {
            return null;
        }

        // Normalizar orientacion del poligono
        const signo = Math.sign(areaConSigno);
        const area = Math.abs(areaConSigno);

        const IxGlobal = signo * sumaIx / 12;
        const IyGlobal = signo * sumaIy / 12;
        const IxyGlobal = signo * sumaIxy / 24;

        // Traslado a los ejes centroidales
        // mediante el teorema de Steiner

        const IxG = IxGlobal -
            area * centroide.y ** 2;

        const IyG = IyGlobal -
            area * centroide.x ** 2;

        const IxyG = IxyGlobal -
            area * centroide.x * centroide.y;

        return {
            Ix: IxG,
            Iy: IyG,
            Ixy: IxyG
        };
    }

    // =====================================
    // MOSTRAR RESULTADOS DE INERCIA
    // =====================================

    function actualizarInercias() {

        const inercias = calcularInercias();

        if (inercias === null) {

            resultadoInerciaX.textContent = "Pendiente";
            resultadoInerciaY.textContent = "Pendiente";
            resultadoProductoInercia.textContent =
                "Pendiente";

            return;
        }

        resultadoInerciaX.textContent =
            formatoNumero(inercias.Ix) + " u⁴";

        resultadoInerciaY.textContent =
            formatoNumero(inercias.Iy) + " u⁴";

        resultadoProductoInercia.textContent =
            formatoNumero(inercias.Ixy) + " u⁴";
    }

    // =====================================
    // INERCIAS RESPECTO A EJES X - Y
    // =====================================

    function calcularInerciasReferencia() {

        if (!figuraCerrada || puntos.length < 3) {
            return null;
        }

        // Calculos existentes
        const inerciasG = calcularInercias();
        const centroide = calcularCentroide();
        const area = calcularAreaPoligono();

        if (
            inerciasG === null ||
            centroide === null ||
            area === null
        ) {
            return null;
        }

        // Distancias respecto al origen elegido
        const dx = centroide.x - origenReferenciaX;
        const dy = centroide.y - origenReferenciaY;

        // Aplicar teorema de Steiner
        const Ix = inerciasG.Ix + area * dy ** 2;

        const Iy = inerciasG.Iy + area * dx ** 2;

        const Ixy = inerciasG.Ixy + area * dx * dy;

        return {
            Ix: Ix,
            Iy: Iy,
            Ixy: Ixy
        };
    }

    // =====================================
    // MOSTRAR INERCIAS DE REFERENCIA
    // =====================================

    function actualizarInerciasReferencia() {

        const inercias = calcularInerciasReferencia();

        if (inercias === null) {

            resultadoReferenciaX.textContent =
                "Pendiente";

            resultadoReferenciaY.textContent =
                "Pendiente";

            resultadoProductoReferencia.textContent =
                "Pendiente";

            return;
        }

        resultadoReferenciaX.textContent =
            formatoNumero(inercias.Ix) + " u⁴";

        resultadoReferenciaY.textContent =
            formatoNumero(inercias.Iy) + " u⁴";

        resultadoProductoReferencia.textContent =
            formatoNumero(inercias.Ixy) + " u⁴";
    }

    // =====================================
    // ACTUALIZAR TABLA GEOMETRICA
    // =====================================

    // =====================================
    // PROPIEDADES DE UNA FIGURA GUARDADA
    // =====================================

    function calcularPropiedadesFigura(vertices) {

        if (vertices.length < 3) return null;

        let sumaCruz = 0;
        let sumaX = 0;
        let sumaY = 0;

        let sumaIx = 0;
        let sumaIy = 0;
        let sumaIxy = 0;

        for (let i = 0; i < vertices.length; i++) {

            const p1 = vertices[i];

            const p2 =
                vertices[(i + 1) % vertices.length];

            const x1 = p1.x;
            const y1 = p1.y;
            const x2 = p2.x;
            const y2 = p2.y;

            const cruz = x1 * y2 - x2 * y1;

            sumaCruz += cruz;

            // Primeros momentos de area
            sumaX += (x1 + x2) * cruz;
            sumaY += (y1 + y2) * cruz;

            // Segundos momentos de area
            sumaIx += cruz * (
                y1 * y1 + y1 * y2 + y2 * y2
            );

            sumaIy += cruz * (
                x1 * x1 + x1 * x2 + x2 * x2
            );

            // Producto de inercia
            sumaIxy += cruz * (
                2 * x1 * y1 +
                x1 * y2 +
                x2 * y1 +
                2 * x2 * y2
            );
        }

        // Area geometrica positiva
        const areaConSigno = sumaCruz / 2;

        if (Math.abs(areaConSigno) < 1e-12) {
            return null;
        }

        const area = Math.abs(areaConSigno);

        // Centroide global de la figura
        const xCentroide = sumaX / (6 * areaConSigno);
        const yCentroide = sumaY / (6 * areaConSigno);

        // Corregir sentido horario o antihorario
        const orientacion = Math.sign(areaConSigno);

        const Ix0 = orientacion * sumaIx / 12;
        const Iy0 = orientacion * sumaIy / 12;
        const Ixy0 = orientacion * sumaIxy / 24;

        // Momentos centroidales
        const IxG = Ix0 - area * yCentroide ** 2;
        const IyG = Iy0 - area * xCentroide ** 2;

        const IxyG = Ixy0 -
            area * xCentroide * yCentroide;

        // Distancias al origen seleccionado
        const dx = xCentroide - origenReferenciaX;
        const dy = yCentroide - origenReferenciaY;

        // Teorema de Steiner
        const Ix = IxG + area * dy ** 2;
        const Iy = IyG + area * dx ** 2;
        const Ixy = IxyG + area * dx * dy;

        return {
            area: area,
            x: dx,
            y: dy,
            IxG: IxG,
            IyG: IyG,
            IxyG: IxyG,
            Ix: Ix,
            Iy: Iy,
            Ixy: Ixy
        };
    }

    // =====================================
    // TABLA DE MULTIPLES FIGURAS
    // =====================================

    function actualizarTablaGeometrica() {
        console.log(
            "Figuras guardadas:",
            figurasGuardadas.length
        );


        if (!cuerpoTablaGeometrica) return;

        // Limpiar la tabla
        cuerpoTablaGeometrica.replaceChildren();

        if (figurasGuardadas.length === 0) {

            const fila = document.createElement("tr");
            const celda = document.createElement("td");

            celda.colSpan = 11;
            celda.textContent =
                "No hay figuras guardadas.";

            fila.appendChild(celda);
            cuerpoTablaGeometrica.appendChild(fila);

            return;
        }

        // Recorrer todas las figuras guardadas
        figurasGuardadas.forEach(function (figura, indice) {

            const propiedades =
                calcularPropiedadesFigura(figura.puntos);

            if (propiedades === null) return;

            // +1 para material, -1 para vacio
            const signo = figura.signo;

            // Preparar las 11 columnas
            const valores = [
                "Figura " + (indice + 1),

                signo === 1 ? "+" : "-",

                formatoNumero(signo * propiedades.area),

                formatoNumero(propiedades.x),

                formatoNumero(propiedades.y),

                formatoNumero(signo * propiedades.IxG),

                formatoNumero(signo * propiedades.IyG),

                formatoNumero(signo * propiedades.IxyG),

                formatoNumero(signo * propiedades.Ix),

                formatoNumero(signo * propiedades.Iy),

                formatoNumero(signo * propiedades.Ixy)
            ];

            // Crear fila
            const fila = document.createElement("tr");

            valores.forEach(function (valor) {

                const celda = document.createElement("td");

                celda.textContent = valor;

                fila.appendChild(celda);
            });

            // Identificar areas negativas
            if (signo === -1) {
                fila.classList.add("figura-negativa");
            }

            cuerpoTablaGeometrica.appendChild(fila);
        });
    }
    // =====================================
    // AREA Y CENTROIDE DE LA SECCION COMPUESTA
    // =====================================

    function actualizarTotalesSeccion() {

        const celdaArea =
            document.getElementById("areaTotalCompuesta");

        const celdaX =
            document.getElementById("centroideTotalX");

        const celdaY =
            document.getElementById("centroideTotalY");

        if (!celdaArea || !celdaX || !celdaY) {
            return;
        }

        // Si no existen figuras guardadas
        if (figurasGuardadas.length === 0) {

            celdaArea.textContent = "—";
            celdaX.textContent = "—";
            celdaY.textContent = "—";

            return;
        }

        let areaTotal = 0;
        let sumaAx = 0;
        let sumaAy = 0;

        // Recorrer todas las figuras guardadas
        for (const figura of figurasGuardadas) {

            const propiedades =
                calcularPropiedadesFigura(figura.puntos);

            if (propiedades === null) {

                celdaArea.textContent = "No válida";
                celdaX.textContent = "—";
                celdaY.textContent = "—";

                return;
            }

            // Area positiva o negativa
            const areaFirmada =
                figura.signo * propiedades.area;

            // Suma algebraica de areas
            areaTotal += areaFirmada;

            // Primeros momentos de area
            sumaAx += areaFirmada * propiedades.x;

            sumaAy += areaFirmada * propiedades.y;
        }

        // Mostrar area total
        celdaArea.textContent =
            formatoNumero(areaTotal);

        // Verificar que exista area neta positiva
        if (areaTotal <= 1e-12) {

            celdaX.textContent = "No válido";
            celdaY.textContent = "No válido";

            return;
        }

        // Centroide global de la seccion
        const xTotal = sumaAx / areaTotal;
        const yTotal = sumaAy / areaTotal;

        // Mostrar resultados
        celdaX.textContent =
            formatoNumero(xTotal);

        celdaY.textContent =
            formatoNumero(yTotal);
    }

    
    // =====================================
    // INERCIAS TOTALES DE SECCION COMPUESTA
    // =====================================

    function actualizarInerciasTotales() {

        // Celdas de resultados
      



const ids = [
    "totalIxG",
    "totalIyG",
    "totalIxyG",
    "totalIx",
    "totalIy",
    "totalIxy",
    "resultadoIp",
    "resultadoId",
    "resultadoR",
    "resultadoI1",
    "resultadoI2",
    "resultadoThetaP"
];



        const celdas = ids.map(function (id) {
            return document.getElementById(id);
        });

        // Comprobar existencia de las celdas
        if (celdas.some(celda => celda === null)) {
            return;
        }

        // Limpiar resultados anteriores
        celdas.forEach(function (celda) {
            celda.textContent = "—";
        });

        if (figurasGuardadas.length === 0) {
            return;
        }

        // =====================================
        // ACUMULADORES
        // =====================================

        let areaTotal = 0;
        let sumaAx = 0;
        let sumaAy = 0;

        let IxTotal = 0;
        let IyTotal = 0;
        let IxyTotal = 0;

        // =====================================
        // RECORRER FIGURAS GUARDADAS
        // =====================================

        for (const figura of figurasGuardadas) {

            const propiedades =
                calcularPropiedadesFigura(figura.puntos);

            if (propiedades === null) {
                return;
            }

            const signo = figura.signo;

            const areaFirmada =
                signo * propiedades.area;

            // Area y primeros momentos
            areaTotal += areaFirmada;

            sumaAx += areaFirmada * propiedades.x;
            sumaAy += areaFirmada * propiedades.y;

            // Inercias respecto a los ejes X - Y
            IxTotal += signo * propiedades.Ix;
            IyTotal += signo * propiedades.Iy;
            IxyTotal += signo * propiedades.Ixy;
        }

        // Validar area neta
        if (areaTotal <= 1e-12) {
            return;
        }

        // =====================================
        // CENTROIDE GLOBAL
        // =====================================

        const xTotal = sumaAx / areaTotal;
        const yTotal = sumaAy / areaTotal;

        // =====================================
        // TEOREMA DE STEINER
        // =====================================

        const IxGTotal =
            IxTotal - areaTotal * yTotal ** 2;

        const IyGTotal =
            IyTotal - areaTotal * xTotal ** 2;

        const IxyGTotal =
            IxyTotal - areaTotal * xTotal * yTotal;

// =====================================
// CALCULO DE Ip E Id
// =====================================

// Promedio de las inercias centroidales
const Ip = (IxGTotal + IyGTotal) / 2;

// Semidiferencia de las inercias
const Id = (IxGTotal - IyGTotal) / 2;

// =====================================
// RADIO DEL CIRCULO DE MOHR
// =====================================

const R = Math.hypot(Id, IxyGTotal);

// =====================================
// MOMENTOS DE INERCIA PRINCIPALES
// =====================================

// Inercia principal maxima
const I1 = Ip + R;

// Inercia principal minima
const I2 = Ip - R;

// =====================================
// ANGULO DE LOS EJES PRINCIPALES
// =====================================

// Tolerancia para inercias casi iguales
const tolerancia = 1e-10 * Math.max(
    1,
    Math.abs(IxGTotal),
    Math.abs(IyGTotal),
    Math.abs(IxyGTotal)
);

// Angulo en radianes
let thetaRad = 0;

if (R > tolerancia) {

    thetaRad = 0.5 * Math.atan2(
        -2 * IxyGTotal,
        IxGTotal - IyGTotal
    );

}

// Conversion de radianes a grados
const thetaGrados = thetaRad * 180 / Math.PI;

        // =====================================
        // MOSTRAR RESULTADOS
        // =====================================




const resultados = [
    IxGTotal,
    IyGTotal,
    IxyGTotal,
    IxTotal,
    IyTotal,
    IxyTotal,
    Ip,
    Id,
    R,
    I1,
    I2,
    thetaGrados
];


        resultados.forEach(function (valor, indice) {

            // Evitar valores residuales cercanos a cero
            const valorFinal =
                Math.abs(valor) < 1e-9 ? 0 : valor;

            celdas[indice].textContent =
                formatoNumero(valorFinal);
        });
    }


    

    // =====================================
    // DIBUJAR CENTROIDE GLOBAL DE LA SECCION
    // =====================================

    function dibujarCentroideTotal(ancho, alto) {

        if (figurasGuardadas.length === 0) return;

        let areaTotal = 0;
        let sumaAx = 0;
        let sumaAy = 0;

        for (const figura of figurasGuardadas) {

            const propiedades =
                calcularPropiedadesFigura(figura.puntos);

            if (propiedades === null) return;

            const areaFirmada =
                figura.signo * propiedades.area;

            areaTotal += areaFirmada;

            sumaAx += areaFirmada * propiedades.x;
            sumaAy += areaFirmada * propiedades.y;
        }

        if (areaTotal <= 1e-12) return;

        // Centroide relativo al origen actual
        const xRelativo = sumaAx / areaTotal;
        const yRelativo = sumaAy / areaTotal;

        // Recuperar la posicion geometrica real
        const xGlobal = xRelativo + origenReferenciaX;
        const yGlobal = yRelativo + origenReferenciaY;

        // COMPROBACION DEL CENTROIDE GLOBAL
        console.log("CENTROIDE GLOBAL:", {
            figuras: figurasGuardadas.length,
            x: xGlobal,
            y: yGlobal
        });

        // Convertir a pixeles
        const gx = pantallaX(xGlobal, ancho);
        const gy = pantallaY(yGlobal, alto);

        // No dibujar si esta fuera del plano visible
        if (
            gx < 0 || gx > ancho ||
            gy < 0 || gy > alto
        ) return;

        ctx.save();

        // Cruz del centroide total
        ctx.strokeStyle = "#803cc4";
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(gx - 14, gy);
        ctx.lineTo(gx + 14, gy);
        ctx.moveTo(gx, gy - 14);
        ctx.lineTo(gx, gy + 14);
        ctx.stroke();

        // Circulo central
        ctx.beginPath();
        ctx.arc(gx, gy, 7, 0, Math.PI * 2);

        ctx.fillStyle = "#803cc4";
        ctx.fill();

        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Etiqueta
        ctx.font = "bold 13px Arial";
        ctx.fillStyle = "#803cc4";
        ctx.textAlign = "left";

        ctx.fillText("G total", gx + 15, gy - 12);

        ctx.restore();
    }

    // =====================================
    // DIBUJAR EJES CENTROIDALES GLOBALES
    // =====================================

    function dibujarEjesCentroidales(ancho, alto) {

        if (figurasGuardadas.length === 0) return;

        let areaTotal = 0;
        let sumaAx = 0;
        let sumaAy = 0;

        // Recorrer todas las figuras
        for (const figura of figurasGuardadas) {

            const propiedades =
                calcularPropiedadesFigura(figura.puntos);

            if (propiedades === null) return;

            const areaFirmada =
                figura.signo * propiedades.area;

            areaTotal += areaFirmada;

            sumaAx += areaFirmada * propiedades.x;
            sumaAy += areaFirmada * propiedades.y;
        }

        if (areaTotal <= 1e-12) return;

        // Centroide relativo al origen seleccionado
        const xRelativo = sumaAx / areaTotal;
        const yRelativo = sumaAy / areaTotal;

        // Posicion global del centroide
        const xGlobal = xRelativo + origenReferenciaX;
        const yGlobal = yRelativo + origenReferenciaY;

        // Convertir coordenadas al plano
        const gx = pantallaX(xGlobal, ancho);
        const gy = pantallaY(yGlobal, alto);

        ctx.save();

        // Estilo de los ejes centroidales
        ctx.strokeStyle = "#803cc4";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([9, 6]);

        // EJE CENTROIDAL HORIZONTAL
        if (gy >= 0 && gy <= alto) {

            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(ancho, gy);
            ctx.stroke();
        }

        // EJE CENTROIDAL VERTICAL
        if (gx >= 0 && gx <= ancho) {

            ctx.beginPath();
            ctx.moveTo(gx, 0);
            ctx.lineTo(gx, alto);
            ctx.stroke();
        }

        // Etiquetas de los ejes
        ctx.setLineDash([]);
        ctx.fillStyle = "#803cc4";
        ctx.font = "bold 12px Arial";

        if (gy >= 15 && gy <= alto) {

            ctx.textAlign = "right";
            ctx.fillText("X̄ global", ancho - 10, gy - 7);
        }

        if (gx >= 0 && gx <= ancho - 15) {

            ctx.textAlign = "left";
            ctx.fillText("Ȳ global", gx + 8, 18);
        }

        ctx.restore();
    }

    // =====================================
    // SUMATORIAS DE LAS FIGURAS INDIVIDUALES
    // =====================================

    function actualizarSumatoriasTabla() {

        const sumas = {
            sumaAxTabla: 0,
            sumaAyTabla: 0,
            sumaIxGTabla: 0,
            sumaIyGTabla: 0,
            sumaIxyGTabla: 0
        };

        if (figurasGuardadas.length === 0) {

            for (const id in sumas) {
                const celda = document.getElementById(id);

                if (celda) celda.textContent = "—";
            }

            return;
        }

        for (const figura of figurasGuardadas) {

            const p = calcularPropiedadesFigura(
                figura.puntos
            );

            if (p === null) return;

            const signo = figura.signo;
            const areaFirmada = signo * p.area;

         
            // Sumar directamente los valores
            // de las columnas x barra e y barra

            sumas.sumaAxTabla += p.x;
            sumas.sumaAyTabla += p.y;

            // Sumas de inercias centroidales
            // individuales, con sus signos
            sumas.sumaIxGTabla += signo * p.IxG;
            sumas.sumaIyGTabla += signo * p.IyG;
            sumas.sumaIxyGTabla += signo * p.IxyG;
        }

        // Mostrar las sumatorias
        for (const id in sumas) {

            const celda = document.getElementById(id);

            if (celda) {
                celda.textContent =
                    formatoNumero(sumas[id]);
            }
        }
    }

    // =====================================
    // DIBUJAR EJES PRINCIPALES DE INERCIA
    // =====================================

    function dibujarEjesPrincipales(ancho, alto) {

        if (figurasGuardadas.length === 0) return;

        let areaTotal = 0;
        let sumaAx = 0;
        let sumaAy = 0;

        let IxTotal = 0;
        let IyTotal = 0;
        let IxyTotal = 0;

        // Sumar propiedades de todas las figuras
        for (const figura of figurasGuardadas) {

            const p = calcularPropiedadesFigura(
                figura.puntos
            );

            if (p === null) return;

            const areaFirmada = figura.signo * p.area;

            areaTotal += areaFirmada;

            sumaAx += areaFirmada * p.x;
            sumaAy += areaFirmada * p.y;

            IxTotal += figura.signo * p.Ix;
            IyTotal += figura.signo * p.Iy;
            IxyTotal += figura.signo * p.Ixy;
        }

        if (areaTotal <= 1e-12) return;

        // Centroide total relativo al origen actual
        const xCG = sumaAx / areaTotal;
        const yCG = sumaAy / areaTotal;

        // Inercias centroidales globales
        const IxG = IxTotal - areaTotal * yCG ** 2;
        const IyG = IyTotal - areaTotal * xCG ** 2;
        const IxyG = IxyTotal - areaTotal * xCG * yCG;

        // Semidiferencia y radio de Mohr
        const Id = (IxG - IyG) / 2;
        const R = Math.hypot(Id, IxyG);

        const tolerancia = 1e-10 * Math.max(
            1,
            Math.abs(IxG),
            Math.abs(IyG),
            Math.abs(IxyG)
        );

        // Si I1 = I2, no existe orientacion
        // principal unica
        if (R <= tolerancia) return;

        // Angulo del eje correspondiente a I1
        const theta = 0.5 * Math.atan2(
            -2 * IxyG,
            IxG - IyG
        );

        // Coordenadas geometricas globales de G
        const xGlobal = xCG + origenReferenciaX;
        const yGlobal = yCG + origenReferenciaY;

        // Posicion del centroide en pixeles
        const gx = pantallaX(xGlobal, ancho);
        const gy = pantallaY(yGlobal, alto);

        // Longitud suficiente para cruzar el plano
        const largo = Math.hypot(ancho, alto) * 2;

        ctx.save();

        // Trasladar el dibujo hasta el centroide G
        ctx.translate(gx, gy);

        // En el canvas, Y aumenta hacia abajo:
        // por eso el angulo tiene signo negativo
        ctx.rotate(-theta);

        ctx.lineWidth = 2.5;
        ctx.setLineDash([10, 5]);

        // =====================================
        // EJE PRINCIPAL 1 - INERCIA MAXIMA
        // =====================================

        ctx.strokeStyle = "#16846d";

        ctx.beginPath();
        ctx.moveTo(-largo, 0);
        ctx.lineTo(largo, 0);
        ctx.stroke();

        // =====================================
        // EJE PRINCIPAL 2 - INERCIA MINIMA
        // =====================================

        ctx.strokeStyle = "#d88a25";

        ctx.beginPath();
        ctx.moveTo(0, -largo);
        ctx.lineTo(0, largo);
        ctx.stroke();

        ctx.restore();
    }

    // =====================================
    // AGREGAR PUNTOS
    // =====================================

    botonAgregar.addEventListener("click", function () {

        const textoX = inputX.value.trim();
        const textoY = inputY.value.trim();

        if (textoX === "" || textoY === "") {

            alert("Introduce las coordenadas X e Y.");
            return;
        }

        const x = Number(textoX);
        const y = Number(textoY);

        if (
            !Number.isFinite(x) ||
            !Number.isFinite(y)
        ) {

            alert("Introduce coordenadas validas.");
            return;
        }

        // Guardar el punto
        
        // Reabrir el contorno si se agrega otro punto
        figuraCerrada = false;

        puntos.push({ x, y });

        const numeroPunto = puntos.length;

  
        // Actualizar los puntos registrados
        actualizarListaPuntos();

        // =================================
        // MOSTRAR PUNTO FUERA DE PANTALLA
        // =================================

        const { ancho, alto } = obtenerDimensiones();

        const px = pantallaX(x, ancho);
        const py = pantallaY(y, alto);

        if (
            px < 20 || px > ancho - 20 ||
            py < 20 || py > alto - 20
        ) {

            centroVistaX = x;
            centroVistaY = y;
        }

        dibujarPlano();

        // Limpiar campos
        inputX.value = "";
        inputY.value = "";

        inputX.focus();
    });

    // =====================================
    // CERRAR FIGURA GEOMETRICA
    // =====================================

    botonCerrar.addEventListener("click", function () {

        // Se necesitan al menos 3 puntos
        if (puntos.length < 3) {

            alert(
                "Necesitas al menos 3 puntos para cerrar una figura."
            );

            return;
        }

        // Cambiar el estado de la figura
        figuraCerrada = true;

        // Dibujar el contorno cerrado
        dibujarPlano();

    });

  
    // =====================================
    // LISTA COMPACTA DE FIGURAS
    // =====================================

    function actualizarListaFiguras() {

        listaFiguras.replaceChildren();

        if (figurasGuardadas.length === 0) {

            listaFiguras.textContent =
                "No hay figuras guardadas.";

            return;
        }

        figurasGuardadas.forEach(function (figura, indice) {

            // Fila compacta
            const fila = document.createElement("div");
            fila.className = "figura-registrada";

            // Nombre de la figura
            const nombre = document.createElement("span");

            const signoTexto =
                figura.signo === 1 ? "+" : "-";

            nombre.textContent =
                "Figura " + (indice + 1) +
                " (" + signoTexto + ")";

            // Boton de eliminar
            const botonEliminar =
                document.createElement("button");

            botonEliminar.type = "button";
            botonEliminar.className =
                "boton-eliminar-figura";

            botonEliminar.textContent = "🗑";
            botonEliminar.title =
                "Eliminar figura " + (indice + 1);

            botonEliminar.setAttribute(
                "aria-label",
                "Eliminar figura " + (indice + 1)
            );

            // Accion del boton
            botonEliminar.addEventListener(
                "click",
                function () {

                    const confirmar = confirm(
                        "¿Deseas eliminar la Figura " +
                        (indice + 1) + "?"
                    );

                    if (!confirmar) return;

                    // Eliminar del almacenamiento
                    figurasGuardadas.splice(indice, 1);

                    // Actualizar lista
                    actualizarListaFiguras();

                    // Actualizar tabla de propiedades
                    actualizarTablaGeometrica();

                    actualizarTotalesSeccion();

                    // Redibujar el plano
                    dibujarPlano();
                }
            );

            fila.appendChild(nombre);
            fila.appendChild(botonEliminar);

            listaFiguras.appendChild(fila);
        });
    }
 

    // =====================================
    // GUARDAR FIGURA GEOMETRICA
    // =====================================

    botonGuardarFigura.addEventListener("click", function () {

        // Verificar que la figura este cerrada
        if (!figuraCerrada || puntos.length < 3) {

            alert(
                "Primero debes construir y cerrar una figura."
            );

            return;
        }

        // Verificar que tenga area
        const area = calcularAreaPoligono();

        if (area === null || area <= 1e-12) {

            alert(
                "La figura no tiene un area valida."
            );

            return;
        }

        // Obtener signo de la figura
        const signo = Number(selectorTipoFigura.value);

        // Copiar los vertices de la figura actual
        const verticesGuardados = puntos.map(function (punto) {

            return {
                x: punto.x,
                y: punto.y
            };
        });

        // Guardar la nueva figura
        figurasGuardadas.push({
            puntos: verticesGuardados,
            signo: signo
        });

        // Limpiar puntos para construir otra figura
        puntos.length = 0;

        // La nueva figura comienza abierta
        figuraCerrada = false;

        // No conservar referencia a un punto
        // que ya no esta en la lista actual
        puntoOrigenActivo = null;

       
        // Actualizar la interfaz
        actualizarListaPuntos();
        actualizarListaFiguras();

        // Actualizar inmediatamente la tabla
        actualizarTablaGeometrica();

        // Redibujar todas las figuras
        dibujarPlano();

        alert(
            "Figura " + figurasGuardadas.length +
            " guardada correctamente."
        );
    });

    // =====================================
    // MOVER ORIGEN A COORDENADAS EXACTAS
    // =====================================

    botonEstablecer.addEventListener("click", function () {

        const textoX = inputOrigenX.value.trim();
        const textoY = inputOrigenY.value.trim();

        if (textoX === "" || textoY === "") {
            alert("Introduce las coordenadas X e Y.");
            return;
        }

        const x = Number(textoX);
        const y = Number(textoY);

        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            alert("Introduce coordenadas validas.");
            return;
        }

        // Nuevo origen de referencia
        origenReferenciaX = x;
        origenReferenciaY = y;

        // Ya no utilizamos un punto registrado
        // como referencia del origen
        puntoOrigenActivo = null;

        // Actualizar resultados y ejes
        actualizarOrigenActual();
        dibujarPlano();

        // Cerrar el formulario
        const desplegable =
            document.querySelector(".origen-coordenadas");

        if (desplegable) {
            desplegable.open = false;
        }
    });


    // =====================================
    // RESTABLECER ORIGEN A (0,0)
    // =====================================

    botonRestablecer.addEventListener("click", function () {

        origenReferenciaX = 0;
        origenReferenciaY = 0;

        puntoOrigenActivo = null;

        inputOrigenX.value = "";
        inputOrigenY.value = "";

        actualizarOrigenActual();
        dibujarPlano();
    });

    // =====================================
    // ACTIVAR MOVIMIENTO MANUAL DEL ORIGEN
    // =====================================

    botonMoverOrigen.addEventListener("click", function () {

        modoMoverOrigenManual = !modoMoverOrigenManual;

        botonMoverOrigen.classList.toggle(
            "activo",
            modoMoverOrigenManual
        );

        if (modoMoverOrigenManual) {

            // Desactivar agregar puntos con el mouse
            modoPuntosMouse = false;

            botonAgregarPuntoMouse.classList.remove("activo");

            botonAgregarPuntoMouse.textContent =
                "Agregar puntos con el mouse";

            botonMoverOrigen.textContent =
                "Salir de mover ejes";

            canvas.style.cursor = "crosshair";

        } else {

            botonMoverOrigen.textContent =
                "Mover ejes manualmente";

            canvas.style.cursor = "grab";
        }
    });

    // =====================================
    // ZOOM CON LA RUEDA DEL MOUSE
    // =====================================

    canvas.addEventListener("wheel", function (evento) {

        evento.preventDefault();

        const rect = canvas.getBoundingClientRect();

        const { ancho, alto } = obtenerDimensiones();

        const mouseX =
            (evento.clientX - rect.left) *
            (ancho / rect.width);

        const mouseY =
            (evento.clientY - rect.top) *
            (alto / rect.height);

        // Coordenada bajo el cursor
        const puntoX = centroVistaX +
            (mouseX - ancho / 2) / escala;

        const puntoY = centroVistaY -
            (mouseY - alto / 2) / escala;

        // Factor de zoom
        const factor =
            evento.deltaY < 0 ? 1.2 : 1 / 1.2;

        escala = Math.max(
            escalaMinima,
            Math.min(
                escalaMaxima,
                escala * factor
            )
        );

        // Mantener el cursor sobre
        // la misma coordenada
        centroVistaX = puntoX -
            (mouseX - ancho / 2) / escala;

        centroVistaY = puntoY +
            (mouseY - alto / 2) / escala;

        dibujarPlano();

    }, { passive: false });

    // =====================================
    // DESPLAZAR SOLAMENTE LA VISTA
    // =====================================

    
    canvas.addEventListener("pointerdown", function (evento) {

        if (evento.button !== 0) return;

        // En modo manual no desplazar la vista
    
        // No desplazar la vista cuando estamos
        // colocando puntos o moviendo el origen
        if (modoPuntosMouse || modoMoverOrigenManual) {
            return;
        }


        arrastrando = true;


        anteriorX = evento.clientX;
        anteriorY = evento.clientY;

        canvas.setPointerCapture(evento.pointerId);

        canvas.style.cursor = "grabbing";
    });

    // Movimiento del mouse
    canvas.addEventListener("pointermove", function (evento) {

        if (!arrastrando) return;

        const dx = evento.clientX - anteriorX;
        const dy = evento.clientY - anteriorY;

        // Desplazar la vista
        centroVistaX -= dx / escala;
        centroVistaY += dy / escala;

        anteriorX = evento.clientX;
        anteriorY = evento.clientY;

        dibujarPlano();
    });

    // =====================================
    // FINALIZAR DESPLAZAMIENTO
    // =====================================

    function detenerArrastre() {

        arrastrando = false;
       
        canvas.style.cursor =
            (modoPuntosMouse || modoMoverOrigenManual)
                ? "crosshair"
                : "grab";


    }

    canvas.addEventListener(
        "pointerup",
        detenerArrastre
    );

    canvas.addEventListener(
        "pointercancel",
        detenerArrastre
    );

    canvas.addEventListener(
        "lostpointercapture",
        detenerArrastre
    );

    // =====================================
    // COLOCAR ORIGEN EN LA REJILLA
    // =====================================

    canvas.addEventListener("click", function (evento) {

        if (bloquearClicPorGesto) return;

        if (!modoMoverOrigenManual) return;

        const rect = canvas.getBoundingClientRect();

        const ancho = canvas.clientWidth;
        const alto = ancho * 0.6;

        // Posicion del mouse o toque
        const mouseX =
            (evento.clientX - rect.left) *
            (ancho / rect.width);

        const mouseY =
            (evento.clientY - rect.top) *
            (alto / rect.height);

        // Convertir la posicion a coordenadas
        const xReal = centroVistaX +
            (mouseX - ancho / 2) / escala;

        const yReal = centroVistaY -
            (mouseY - alto / 2) / escala;

        // Separacion actual de la rejilla
        const intervalo = calcularIntervalo();

        // Encontrar la interseccion mas cercana
        const nuevoX = origenReferenciaX +
            Math.round(
                (xReal - origenReferenciaX) / intervalo
            ) * intervalo;

        const nuevoY = origenReferenciaY +
            Math.round(
                (yReal - origenReferenciaY) / intervalo
            ) * intervalo;

        // Trasladar exclusivamente los ejes
        origenReferenciaX =
            Number(nuevoX.toPrecision(12));

        origenReferenciaY =
            Number(nuevoY.toPrecision(12));

        puntoOrigenActivo = null;

        // Actualizar los resultados
        actualizarOrigenActual();
        dibujarPlano();
    });

    // =====================================
    // AGREGAR PUNTOS CON EL MOUSE
    // =====================================

    botonAgregarPuntoMouse.addEventListener(
        "click",
        function () {

            // Activar o desactivar el modo
            modoPuntosMouse = !modoPuntosMouse;

            // Desactivar mover ejes al agregar puntos
            if (modoPuntosMouse) {

                modoMoverOrigenManual = false;

                botonMoverOrigen.classList.remove("activo");

                botonMoverOrigen.textContent =
                    "Mover ejes manualmente";
            }

            botonAgregarPuntoMouse.classList.toggle(
                "activo",
                modoPuntosMouse
            );

            if (modoPuntosMouse) {

                botonAgregarPuntoMouse.textContent =
                    "Salir de agregar puntos con mouse";

                canvas.style.cursor = "crosshair";

            } else {

                botonAgregarPuntoMouse.textContent =
                    "Agregar puntos con el mouse";

                canvas.style.cursor = "grab";
            }
        }
    );

    // =====================================
    // DETECTAR SI EL USUARIO ARRASTRA
    // =====================================

    canvas.addEventListener("pointerdown", function (evento) {

        if (evento.button !== 0) return;

        inicioClicX = evento.clientX;
        inicioClicY = evento.clientY;

        huboArrastreMouse = false;
    });

    canvas.addEventListener("pointermove", function (evento) {

        if (!arrastrando) return;

        const distancia = Math.hypot(
            evento.clientX - inicioClicX,
            evento.clientY - inicioClicY
        );

        if (distancia > 5) {
            huboArrastreMouse = true;
        }
    });

    // =====================================
    // AGREGAR PUNTO EN INTERSECCION
    // =====================================

    canvas.addEventListener("click", function (evento) {

        // Ignorar el clic generado por un gesto tactil
        if (bloquearClicPorGesto) return;

        // Solo funcionar con el modo activo
        if (!modoPuntosMouse) return;

        // No agregar puntos al arrastrar
        if (huboArrastreMouse) return;

        const rect = canvas.getBoundingClientRect();

        const ancho = canvas.clientWidth;
        const alto = ancho * 0.6;

        // Posicion del mouse en el canvas
        const mouseX =
            (evento.clientX - rect.left) *
            (ancho / rect.width);

        const mouseY =
            (evento.clientY - rect.top) *
            (alto / rect.height);

        // Convertir pixeles a coordenadas
        const xReal = centroVistaX +
            (mouseX - ancho / 2) / escala;

        const yReal = centroVistaY -
            (mouseY - alto / 2) / escala;

        // Intervalo actual de la cuadricula
        const intervalo = calcularIntervalo();

        // Ajustar a la interseccion mas cercana
        const xAjustado = origenReferenciaX +
            Math.round(
                (xReal - origenReferenciaX) / intervalo
            ) * intervalo;

        const yAjustado = origenReferenciaY +
            Math.round(
                (yReal - origenReferenciaY) / intervalo
            ) * intervalo;

        // Reducir errores de decimales
        const xFinal = Number(xAjustado.toPrecision(12));
        const yFinal = Number(yAjustado.toPrecision(12));

        // Utilizar el sistema existente
        // para registrar el nuevo punto
        inputX.value = String(xFinal);
        inputY.value = String(yFinal);

        botonAgregar.click();
    });

    // =====================================
    // ZOOM TACTIL CON DOS DEDOS
    // =====================================

    let distanciaTactilAnterior = null;
    let centroTactilAnterior = null;
    let bloquearClicPorGesto = false;

    function obtenerDatosTactiles(toques) {

        const rect = canvas.getBoundingClientRect();

        const ancho = canvas.clientWidth;
        const alto = ancho * 0.6;

        const t1 = toques[0];
        const t2 = toques[1];

        const x1 = (t1.clientX - rect.left) *
            ancho / rect.width;

        const y1 = (t1.clientY - rect.top) *
            alto / rect.height;

        const x2 = (t2.clientX - rect.left) *
            ancho / rect.width;

        const y2 = (t2.clientY - rect.top) *
            alto / rect.height;

        return {
            distancia: Math.hypot(x2 - x1, y2 - y1),
            x: (x1 + x2) / 2,
            y: (y1 + y2) / 2
        };
    }

    // Iniciar el gesto de dos dedos

    canvas.addEventListener("touchstart", function (evento) {

        if (evento.touches.length === 1) {
            bloquearClicPorGesto = false;
        }

        if (evento.touches.length === 2) {

            // Detener cualquier arrastre anterior
            arrastrando = false;

            bloquearClicPorGesto = true;

            const datos =
                obtenerDatosTactiles(evento.touches);

            distanciaTactilAnterior = datos.distancia;

            centroTactilAnterior = {
                x: datos.x,
                y: datos.y
            };
        }

    }, { passive: false });

    // =====================================
    // EJECUTAR EL ZOOM TACTIL
    // =====================================

    canvas.addEventListener("touchmove", function (evento) {

        if (evento.touches.length !== 2) return;

        evento.preventDefault();

        arrastrando = false;
        bloquearClicPorGesto = true;

        const datos =
            obtenerDatosTactiles(evento.touches);

        if (
            distanciaTactilAnterior === null ||
            centroTactilAnterior === null ||
            distanciaTactilAnterior <= 0
        ) {

            distanciaTactilAnterior = datos.distancia;

            centroTactilAnterior = {
                x: datos.x,
                y: datos.y
            };

            return;
        }

        const ancho = canvas.clientWidth;
        const alto = ancho * 0.6;

        // Punto geometrico bajo el centro anterior
        const xReal = centroVistaX +
            (centroTactilAnterior.x - ancho / 2) / escala;

        const yReal = centroVistaY -
            (centroTactilAnterior.y - alto / 2) / escala;

        // Calcular nueva escala
        const factor =
            datos.distancia / distanciaTactilAnterior;

        escala = Math.max(
            escalaMinima,
            Math.min(
                escalaMaxima,
                escala * factor
            )
        );

        // Mantener el plano centrado en los dedos
        centroVistaX = xReal -
            (datos.x - ancho / 2) / escala;

        centroVistaY = yReal +
            (datos.y - alto / 2) / escala;

        distanciaTactilAnterior = datos.distancia;

        centroTactilAnterior = {
            x: datos.x,
            y: datos.y
        };

        dibujarPlano();

    }, { passive: false });

    // =====================================
    // TERMINAR EL GESTO TACTIL
    // =====================================

    canvas.addEventListener("touchend", function (evento) {

        if (evento.touches.length < 2) {

            distanciaTactilAnterior = null;
            centroTactilAnterior = null;
        }

    });

    canvas.addEventListener("touchcancel", function () {

        distanciaTactilAnterior = null;
        centroTactilAnterior = null;

        arrastrando = false;
    });

    // =====================================
    // CONTROL DE EJES CENTROIDALES
    // =====================================

    const casillaEjesCentroidales =
        document.getElementById(
            "mostrarEjesCentroidales"
        );

    casillaEjesCentroidales.addEventListener(
        "change",
        function () {

            dibujarPlano();

        }
    );

// =====================================
// CONTROL DE VISIBILIDAD DEL CENTROIDE G
// =====================================

casillaCentroideGlobal.addEventListener(
    "change",
    function () {

        dibujarPlano();

    }
);

    // =====================================
    // CONTROL DE EJES PRINCIPALES
    // =====================================

    const casillaEjesPrincipales =
        document.getElementById(
            "mostrarEjesPrincipales"
        );

    if (casillaEjesPrincipales) {

        casillaEjesPrincipales.addEventListener(
            "change",
            function () {

                dibujarPlano();

            }
        );
    }

    // ==========================================
    // CIRCULO DE MOHR DE INERCIAS
    // ==========================================

    function dibujarCirculoMohr() {

        const canvasMohr =
            document.getElementById("circuloMohr");

        if (!canvasMohr) return;

        const m = canvasMohr.getContext("2d");

        const W = 900;
        const H = 550;
        function formatoMohr(valor) {
            return Number(valor).toFixed(2);
        }
        canvasMohr.width = W;
        canvasMohr.height = H;

        // Fondo
        m.fillStyle = "#ffffff";
        m.fillRect(0, 0, W, H);

        m.font = "16px Arial";
        m.fillStyle = "#174b82";

        // Si no hay figuras guardadas
        if (figurasGuardadas.length === 0) {

            m.textAlign = "center";
            m.fillText(
                "Guarda una figura para generar el circulo de Mohr.",
                W / 2,
                H / 2
            );

            return;
        }

        // =====================================
        // PROPIEDADES DE LA SECCION COMPUESTA
        // =====================================

        let A = 0;
        let sumaAx = 0;
        let sumaAy = 0;

        let Ix = 0;
        let Iy = 0;
        let Ixy = 0;

        for (const figura of figurasGuardadas) {

            const p =
                calcularPropiedadesFigura(figura.puntos);

            if (p === null) return;

            const s = figura.signo;
            const areaFirmada = s * p.area;

            A += areaFirmada;

            sumaAx += areaFirmada * p.x;
            sumaAy += areaFirmada * p.y;

            Ix += s * p.Ix;
            Iy += s * p.Iy;
            Ixy += s * p.Ixy;
        }

        if (A <= 1e-12) {

            m.fillStyle = "#c83f45";
            m.fillText(
                "El area neta no es valida.",
                250,
                260
            );

            return;
        }

        // Centroide compuesto
        const xCG = sumaAx / A;
        const yCG = sumaAy / A;

        // Inercias centroidales globales
        const IxG = Ix - A * yCG ** 2;
        const IyG = Iy - A * xCG ** 2;

        const IxyG =
            Ixy - A * xCG * yCG;

        // Propiedades del circulo de Mohr
        const Ip = (IxG + IyG) / 2;
        const Id = (IxG - IyG) / 2;
        const R = Math.hypot(Id, IxyG);

        const Imax = Ip + R;
        const Imin = Ip - R;

        // Angulo del eje asociado a Imax
        const thetaP = 0.5 * Math.atan2(
            -2 * IxyG,
            IxG - IyG
        );

        // =====================================
        // DATOS DEL SEGUNDO DIAMETRO U-V
        // Rotacion ilustrativa de 20 grados
        // =====================================

        const thetaUV = 20 * Math.PI / 180;

        const cos2 = Math.cos(2 * thetaUV);
        const sen2 = Math.sin(2 * thetaUV);

        const Iu =
            Ip + Id * cos2 - IxyG * sen2;

        const Iv =
            Ip - Id * cos2 + IxyG * sen2;

        const Iuv =
            Id * sen2 + IxyG * cos2;

        // =====================================
        // DIMENSIONES GRAFICAS
        // =====================================

        const cx = 450;
        const cy = 255;
        const radio = 175;

        // Ejes del grafico
        m.strokeStyle = "#34465d";
        m.lineWidth = 1.8;

        m.beginPath();
        m.moveTo(85, cy);
        m.lineTo(850, cy);

        m.moveTo(85, 75);
        m.lineTo(85, 445);
        m.stroke();

        // Flechas de los ejes
        m.beginPath();
        m.moveTo(850, cy);
        m.lineTo(838, cy - 6);
        m.moveTo(850, cy);
        m.lineTo(838, cy + 6);

        m.moveTo(85, 75);
        m.lineTo(79, 87);
        m.moveTo(85, 75);
        m.lineTo(91, 87);
        m.stroke();

        m.fillStyle = "#174b82";
        m.font = "bold 18px Arial";
        m.textAlign = "left";

        m.fillText("I", 858, cy + 5);
        m.fillText("Ixy", 92, 75);

        // Circunferencia
        if (R > 1e-12) {

            m.beginPath();
            m.arc(cx, cy, radio, 0, 2 * Math.PI);

            m.strokeStyle = "#803cc4";
            m.lineWidth = 3;
            m.stroke();
        }

        // Centro del circulo
        m.beginPath();
        m.arc(cx, cy, 5, 0, 2 * Math.PI);

        m.fillStyle = "#803cc4";
        m.fill();

       m.font = "bold 14px Arial";
m.textAlign = "center";
m.fillText(
    "Ip = " + formatoMohr(Ip),
    cx,
    cy + 23
);
        // =====================================
        // PUNTOS DEL CIRCULO
        // =====================================

        // Escala grafica centrada en Ip
        function convertirPunto(I, producto) {

            if (R <= 1e-12) {
                return { x: cx, y: cy };
            }

            return {
                x: cx + radio * (I - Ip) / R,
                y: cy - radio * producto / R
            };
        }

        const A1 = convertirPunto(IxG, IxyG);
        const B1 = convertirPunto(IyG, -IxyG);

        const U = convertirPunto(Iu, Iuv);
        const V = convertirPunto(Iv, -Iuv);

        // Dibujar un diametro
        function dibujarDiametro(p1, p2, color, guiones) {

            m.beginPath();

            m.setLineDash(guiones);
            m.moveTo(p1.x, p1.y);
            m.lineTo(p2.x, p2.y);

            m.strokeStyle = color;
            m.lineWidth = 2.2;
            m.stroke();

            m.setLineDash([]);
        }

        // Diametro X-Y
        dibujarDiametro(
            A1, B1,
            "#2879bf",
            [8, 5]
        );

        // Diametro U-V
        dibujarDiametro(
            U, V,
            "#d88a25",
            [4, 5]
        );

        // Dibujar puntos y etiquetas
        function marcarPunto(p, nombre, color, dx, dy) {

            m.beginPath();
            m.arc(p.x, p.y, 5.5, 0, 2 * Math.PI);

            m.fillStyle = "#ffffff";
            m.fill();

            m.strokeStyle = color;
            m.lineWidth = 2.5;
            m.stroke();

            m.font = "bold 13px Arial";
            m.fillStyle = color;
            m.textAlign = "left";

            m.fillText(
                nombre,
                p.x + dx,
                p.y + dy
            );
        }

        // Puntos de los dos diametros
        if (R > 1e-12) {

    marcarPunto(
        A1,
        "(" +
        formatoMohr(IxG) + ", " +
        formatoMohr(IxyG) + ")",
        "#2879bf",
        9,
        -10
    );

    marcarPunto(
        B1,
        "(" +
        formatoMohr(IyG) + ", " +
        formatoMohr(-IxyG) + ")",
        "#2879bf",
        9,
        19
    );

    marcarPunto(
        U,
        "(" +
        formatoMohr(Iu) + ", " +
        formatoMohr(Iuv) + ")",
        "#d88a25",
        9,
        -12
    );

    marcarPunto(
        V,
        "(" +
        formatoMohr(Iv) + ", " +
        formatoMohr(-Iuv) + ")",
        "#d88a25",
        9,
        20
    );
}

        // =====================================
        // INERCIAS PRINCIPALES
        // =====================================
marcarPunto(
    { x: cx - (R > 1e-12 ? radio : 0), y: cy },
    "Imin = " + formatoMohr(Imin),
    "#c83f45",
    -85,
    -12
);

marcarPunto(
    { x: cx + (R > 1e-12 ? radio : 0), y: cy },
    "Imax = " + formatoMohr(Imax),
    "#16846d",
    8,
    -12
);
        // =====================================
        // RADIO R
        // =====================================

        if (R > 1e-12) {

            m.beginPath();
            m.moveTo(cx, cy);
            m.lineTo(A1.x, A1.y);

            m.strokeStyle = "#c83f45";
            m.lineWidth = 2.5;
            m.stroke();

            m.font = "bold 15px Arial";
            m.fillStyle = "#c83f45";
            m.textAlign = "center";

          m.fillText(
    "R = " + formatoMohr(R),
    (cx + A1.x) / 2,
    (cy + A1.y) / 2 - 10
);

            // Arco del angulo 2 theta p
            const inicio = Math.atan2(
                IxyG, Id
            );

            const giro = -inicio;
            const radioArco = 38;

            m.beginPath();

            for (let i = 0; i <= 35; i++) {

                const ang =
                    inicio + giro * i / 35;

                const ax =
                    cx + radioArco * Math.cos(ang);

                const ay =
                    cy - radioArco * Math.sin(ang);

                if (i === 0) {
                    m.moveTo(ax, ay);
                } else {
                    m.lineTo(ax, ay);
                }
            }

            m.strokeStyle = "#16846d";
            m.lineWidth = 2;
            m.stroke();
            m.font = "bold 13px Arial";
m.fillStyle = "#16846d";
m.textAlign = "left";

m.fillText(
    "2θp = " +
   formatoMohr(2 * thetaP * 180 / Math.PI) +
    "°",
    cx + 30,
    cy + 20
);
        }

        // =====================================
        // RESULTADOS DEBAJO DEL GRAFICO
        // =====================================

        m.fillStyle = "#174b82";
        m.font = "14px Arial";
        m.textAlign = "left";

        m.fillText(
            "Ip = " + formatoMohr(Ip),
            75, 480
        );

        m.fillText(
           "R = " + formatoMohr(R),
            340, 480
        );

        m.fillText(
            "Imax = " + formatoMohr(Imax),
            75, 505
        );

        m.fillText(
            "Imin = " + formatoMohr(Imin),
            340, 505
        );

      
        m.fillText(
            "2θp = " +
            formatoMohr(2 * thetaP * 180 / Math.PI) +
            "°",
            610, 480
        );


        m.fillStyle = "#64748b";
        m.font = "12px Arial";

        m.fillText(
            "Diámetro U-V ilustrativo: θ = 20°",
            610, 505
        );
    }

    // =====================================
    // INICIAR PROGRAMA
    // =====================================

    actualizarOrigenActual();
    dibujarPlano();

    // Ajustar al cambiar tamaño de ventana
    window.addEventListener(
        "resize",
        dibujarPlano
    );

});
