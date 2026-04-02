let carrito = []
let telefono = ""
let moneda = "$"
let productosGlobal = []
let productoActual = null
let categoriaAbierta = "todos"
let configGlobal = null
let indiceEditandoCarrito = null
let scrollPosicion = 0
let bloqueoTouchActivo = false
let ultimoAnchoVentana = window.innerWidth
let textoBusquedaActual = ""
let resultadosBusquedaActual = []

function obtenerElemento(id){
  return document.getElementById(id)
}

function calcularPrecioItem(item){
  let precioItem = item.precioBase

  item.extras.forEach(extra => {
    let cantidadExtra = extra.cantidad || 1
    precioItem += extra.precio * cantidadExtra
  })

  return precioItem * item.cantidad
}

function calcularTotalCarrito(){
  let total = 0

  carrito.forEach(item => {
    total += calcularPrecioItem(item)
  })

  return total
}

function obtenerEspacioBaseBoton(){
  return window.innerWidth <= 768 ? 12 : 20
}

async function cargarConfig(){
  try{
    let res = await fetch("config.json")
    configGlobal = await res.json()

    telefono = configGlobal.telefono || ""
    moneda = configGlobal.moneda || "$"

    aplicarDatosGenerales()
    renderizarHorarios()
    renderizarRedes()
    renderizarCategorias()
    renderizarOpcionesEntrega()
    renderizarOpcionesPago()
    crearSliderInfinito()
    actualizarBotonPedidoFlotante()
    aplicarTema()
    setTimeout(ajustarTituloNegocio, 50)
  }catch(error){
    console.error("Error al cargar config.json:", error)
  }
}

function aplicarDatosGenerales(){
  let nombreNegocio = obtenerElemento("nombreNegocio")
  let logoNegocio = obtenerElemento("logoNegocio")
  let favicon = obtenerElemento("favicon")
  let footerCopy = obtenerElemento("footerCopy")
  let tituloRedes = obtenerElemento("tituloRedes")
  let pantallaCargaLogo = obtenerElemento("pantallaCargaLogo")
  let textoPantallaCarga = obtenerElemento("textoPantallaCarga")

  if(nombreNegocio){
    nombreNegocio.innerHTML = `<span>${configGlobal.nombreNegocio || "Mi Restaurante"}</span>`
  }

  document.title = configGlobal.tituloPagina || configGlobal.nombreNegocio || "Pedidos Online"

  if(logoNegocio && configGlobal.logo){
    logoNegocio.src = configGlobal.logo
  }

  if(favicon && configGlobal.favicon){
    favicon.href = configGlobal.favicon
  }

  if(footerCopy){
    footerCopy.innerText = configGlobal.footerTexto || "© 2026 Pedidos Online"
  }

  if(tituloRedes){
    tituloRedes.innerText = configGlobal.tituloRedes || "Seguinos"
  }

  if(textoPantallaCarga){
  let ocultarTextoPantallaCarga = configGlobal.tema?.logos?.ocultarTextoPantallaCarga === true

  if(ocultarTextoPantallaCarga){
    textoPantallaCarga.style.display = "none"
  }else{
    textoPantallaCarga.style.display = "block"
    textoPantallaCarga.innerText = configGlobal.nombreNegocio || "Cargando..."
  }
}

  if(pantallaCargaLogo && configGlobal.logo){
    pantallaCargaLogo.src = configGlobal.logo
  }
}

function ajustarTituloNegocio(){
  const titulo = document.getElementById("nombreNegocio")
  if(!titulo) return

  const span = titulo.querySelector("span")
  if(!span) return

  // resetear clase
  titulo.classList.remove("titulo-largo")

  // detectar overflow real
  if(span.scrollWidth > titulo.clientWidth){
    titulo.classList.add("titulo-largo")
  }
}

function renderizarHorarios(){
  let listaHorarios = obtenerElemento("listaHorarios")
  if(!listaHorarios) return

  listaHorarios.innerHTML = ""

  let horarios = configGlobal.horarios || []

  horarios.forEach(item => {
    let p = document.createElement("p")
    let textoRangos = (item.rangos || []).join(" / ")

    p.innerHTML = `<strong>${item.dia}:</strong> ${textoRangos || "Cerrado"}`
    listaHorarios.appendChild(p)
  })
}

function renderizarRedes(){
  let redesContainer = obtenerElemento("redesContainer")
  if(!redesContainer) return

  redesContainer.innerHTML = ""

  let redes = configGlobal.redes || []

  redes.forEach(red => {
    if(!red.link || !red.icono) return

    let a = document.createElement("a")
    a.href = red.link
    a.target = "_blank"
    a.rel = "noopener noreferrer"

    let img = document.createElement("img")
    img.src = red.icono
    img.alt = red.nombre || "Red social"

    a.appendChild(img)
    redesContainer.appendChild(a)
  })
}

function renderizarCategorias(){
  let contenedor = obtenerElemento("categoriasAcordeon")
  if(!contenedor) return

  contenedor.innerHTML = ""

  let categorias = configGlobal.categorias || []

  categorias.forEach(categoria => {
    let bloque = document.createElement("div")
    bloque.classList.add("categoriaBloque")

    bloque.innerHTML = `
      <button type="button" class="categoriaBtn" onclick="toggleCategoria('${categoria.id}')">
        ${categoria.nombre}
      </button>
      <div id="panel-${categoria.id}" class="categoriaPanel"></div>
    `

    contenedor.appendChild(bloque)
  })
}

function renderizarOpcionesEntrega(){
  let tipoEntrega = obtenerElemento("tipoEntrega")
  if(!tipoEntrega) return

  tipoEntrega.innerHTML = ""

  let opcionesEntrega = configGlobal.opcionesEntrega || [
    { nombre: "Retiro en local", requiereDireccion: false },
    { nombre: "Envío gratis", requiereDireccion: true }
  ]

  opcionesEntrega.forEach(opcion => {
    let option = document.createElement("option")
    option.value = opcion.nombre
    option.innerText = opcion.nombre
    option.dataset.requiereDireccion = opcion.requiereDireccion ? "true" : "false"
    tipoEntrega.appendChild(option)
  })
}

function renderizarOpcionesPago(){
  let formaPago = obtenerElemento("formaPago")
  if(!formaPago) return

  formaPago.innerHTML = ""

  let opcionesPago = configGlobal.opcionesPago || [
    { nombre: "Efectivo", requierePagaCon: true },
    { nombre: "Transferencia", requierePagaCon: false }
  ]

  opcionesPago.forEach(opcion => {
    let option = document.createElement("option")
    option.value = opcion.nombre
    option.innerText = opcion.nombre
    option.dataset.requierePagaCon = opcion.requierePagaCon ? "true" : "false"
    formaPago.appendChild(option)
  })
}

function crearSliderInfinito(){
  let sliderTrack = document.getElementById("sliderTrack")
  let sliderSection = document.getElementById("sliderProductos")

  if(!sliderTrack || !sliderSection) return

  let imagenes = configGlobal.sliderImagenes || []

  sliderTrack.innerHTML = ""

  if(imagenes.length < 2){
    sliderSection.style.display = "none"
    console.warn("El slider necesita al menos 2 imágenes en config.json")
    return
  }

  sliderSection.style.display = "block"

  let repetidas = [...imagenes, ...imagenes]

  repetidas.forEach(item => {
  let img = document.createElement("img")
  img.src = item.imagen
  img.alt = item.producto || "Producto destacado"

  if(item.producto){
    let indiceProducto = productosGlobal.findIndex(
      producto => producto.nombre === item.producto
    )

    if(indiceProducto !== -1){
      img.style.cursor = "pointer"
      img.addEventListener("click", () => {
        abrirProducto(indiceProducto)
      })
    }
  }

  sliderTrack.appendChild(img)
})

  esperarImagenesSlider(() => {
    actualizarAnimacionSlider(imagenes.length)
  })
}

function calcularCantidadTotalCarrito(){
  let cantidad = 0

  carrito.forEach(item => {
    cantidad += item.cantidad
  })

  return cantidad
}

function actualizarContadorCarrito(){
  let contador = obtenerElemento("contadorCarrito")
  if(!contador) return

  let cantidadTotal = calcularCantidadTotalCarrito()

  contador.innerText = cantidadTotal

  if(cantidadTotal > 0){
    contador.style.display = "flex"
  }else{
    contador.style.display = "none"
  }
}

function esperarImagenesSlider(callback){
  let sliderTrack = document.getElementById("sliderTrack")
  if(!sliderTrack) return

  let imagenes = Array.from(sliderTrack.querySelectorAll("img"))
  if(imagenes.length === 0){
    callback()
    return
  }

  let cargadas = 0

  function verificar(){
    cargadas++
    if(cargadas === imagenes.length){
      callback()
    }
  }

  imagenes.forEach(img => {
    if(img.complete){
      verificar()
    }else{
      img.addEventListener("load", verificar, { once:true })
      img.addEventListener("error", verificar, { once:true })
    }
  })
}

function actualizarAnimacionSlider(cantidadOriginal){
  let sliderTrack = document.getElementById("sliderTrack")
  if(!sliderTrack) return

  let imagenes = Array.from(sliderTrack.querySelectorAll("img"))
  if(imagenes.length < cantidadOriginal * 2) return

  let anchoRealBloque = imagenes[cantidadOriginal].offsetLeft - imagenes[0].offsetLeft

  let duracion = window.innerWidth <= 768 ? 28 : 35
  let nombreAnimacion = "deslizarProductosAuto"

  let styleTag = document.getElementById("sliderDynamicStyle")

  if(!styleTag){
    styleTag = document.createElement("style")
    styleTag.id = "sliderDynamicStyle"
    document.head.appendChild(styleTag)
  }

  styleTag.innerHTML = `
    @keyframes ${nombreAnimacion}{
      from{
        transform: translateX(0);
      }
      to{
        transform: translateX(-${anchoRealBloque}px);
      }
    }
  `

  sliderTrack.style.animation = "none"
  sliderTrack.offsetHeight
  sliderTrack.style.animation = `${nombreAnimacion} ${duracion}s linear infinite`
}

async function cargarProductos(){
  try{
    let res = await fetch("productos.json")
    productosGlobal = await res.json()

    cerrarTodasLasCategorias()
    actualizarBotonPedidoFlotante()
    ajustarBotonFlotanteConFooter()
  }catch(error){
    console.error("Error al cargar productos.json:", error)
  }
}

function actualizarBotonPedidoFlotante(){
  let total = calcularTotalCarrito()
  let boton = obtenerElemento("btnPedidoFlotante")
  if(!boton) return

  boton.innerText = `Enviar pedido al WhatsApp · ${moneda}${total}`
}

function abrirUbicacion(){
  let linkMaps = configGlobal?.ubicacionLink?.trim()

  if(!linkMaps){
    alert("No hay una ubicación configurada")
    return
  }

  window.open(linkMaps, "_blank")
}

function toggleCarrito(){
  let carritoPanel = obtenerElemento("carrito")

  if(carritoPanel.style.display === "block"){
    carritoPanel.style.display = "none"
  }else{
    carritoPanel.style.display = "block"
  }
}

function bloquearTouchFondo(e){
  const hayModalAbierto = document.querySelector('.modal[style*="flex"]')
  if(!hayModalAbierto) return

  const modalContent = e.target.closest(".modal-content")
  if(!modalContent){
    e.preventDefault()
  }
}

function activarBloqueoTouch(){
  if(bloqueoTouchActivo) return
  document.addEventListener("touchmove", bloquearTouchFondo, { passive:false })
  bloqueoTouchActivo = true
}

function desactivarBloqueoTouch(){
  if(!bloqueoTouchActivo) return
  document.removeEventListener("touchmove", bloquearTouchFondo, { passive:false })
  bloqueoTouchActivo = false
}

function abrirHorarios(){
  obtenerElemento("horariosModal").style.display = "flex"
  bloquearScrollPagina()
}

function cerrarHorarios(){
  obtenerElemento("horariosModal").style.display = "none"
  desbloquearScrollPagina()
}

function ajustarBotonFlotanteConFooter(){
  let boton = obtenerElemento("btnPedidoFlotante")
  let footer = document.querySelector("footer")

  if(!boton || !footer) return

  let footerRect = footer.getBoundingClientRect()
  let espacioBase = obtenerEspacioBaseBoton()
  let superposicion = window.innerHeight - footerRect.top

  if(superposicion > 0){
    boton.style.bottom = (superposicion + espacioBase) + "px"
  }else{
    boton.style.bottom = espacioBase + "px"
  }
}

function animarAjusteBotonFlotante(duracion = 450){
  let inicio = performance.now()

  function actualizar(){
    ajustarBotonFlotanteConFooter()

    if(performance.now() - inicio < duracion){
      requestAnimationFrame(actualizar)
    }
  }

  requestAnimationFrame(actualizar)
}

function mostrarProductosEnPanel(productos, panelId){
  let panel = obtenerElemento(panelId)
  if(!panel) return

  panel.innerHTML = ""

  let contenedor = document.createElement("div")
  contenedor.classList.add("panelProductos")

  let mostrarDescripcion = configGlobal?.tema?.productos?.mostrarDescripcionPreview !== false

  productos.forEach(producto => {
    let div = document.createElement("div")
    let imagen = producto.imagen ? producto.imagen : "Images/producto-default.png"
    let indiceReal = productosGlobal.indexOf(producto)

    let disponible = producto.disponible !== false
    let textoEstado = disponible
      ? '<span class="estadoProducto disponible">Disponible</span>'
      : '<span class="estadoProducto agotado">Agotado</span>'

    let descripcionPreview = ""

    if(mostrarDescripcion && producto.descripcion){
      descripcionPreview = `<p class="producto-descripcion">${producto.descripcion}</p>`
    }

    div.classList.add("producto")

    if(disponible){
      div.setAttribute("onclick", `abrirProducto(${indiceReal})`)
    }else{
      div.classList.add("productoAgotado")
    }

    div.innerHTML = `
      <div class="producto-info">
        ${textoEstado}
        <h3>${producto.nombre}</h3>
        ${descripcionPreview}
      </div>

      <div class="producto-lado-derecho">
        <img src="${imagen}" class="producto-img" alt="${producto.nombre}">
        <p class="producto-precio">${moneda}${producto.precio}</p>
      </div>
    `

    contenedor.appendChild(div)
  })

  panel.appendChild(contenedor)
}

function cerrarTodasLasCategorias(){
  let paneles = document.querySelectorAll(".categoriaPanel")

  paneles.forEach(panel => {
    panel.classList.remove("abierto")
  })
}

function toggleCategoria(categoriaId){
  let panelId = `panel-${categoriaId}`
  let panel = obtenerElemento(panelId)

  if(!panel) return

  let yaEstabaAbierto = panel.classList.contains("abierto")

  cerrarTodasLasCategorias()

  if(yaEstabaAbierto){
    categoriaAbierta = null
    ajustarBotonFlotanteConFooter()
    animarAjusteBotonFlotante()
    return
  }

  let productosAMostrar = productosGlobal

  if(categoriaId !== "todos"){
    productosAMostrar = productosGlobal.filter(producto => producto.categoria === categoriaId)
  }

  mostrarProductosEnPanel(productosAMostrar, panelId)
  panel.classList.add("abierto")
  categoriaAbierta = categoriaId

  ajustarBotonFlotanteConFooter()
  animarAjusteBotonFlotante()
}

function mostrarPantallaCarga(){
  let pantalla = obtenerElemento("pantallaCarga")
  if(!pantalla) return

  pantalla.classList.remove("oculta")
}

function ocultarPantallaCarga(){
  let pantalla = obtenerElemento("pantallaCarga")
  if(!pantalla) return

  pantalla.classList.add("oculta")
}

function negocioAbierto(){
  if(!configGlobal || !configGlobal.horarios) return true

  const ahora = new Date()

  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado"
  ]

  const diaActualIndex = ahora.getDay()
  const diaActual = dias[diaActualIndex]
  const minutosActuales = ahora.getHours() * 60 + ahora.getMinutes()

  const horarioHoy = configGlobal.horarios.find(h => h.dia === diaActual)

  if(horarioHoy && rangoActivoEnDia(horarioHoy.rangos || [], minutosActuales)){
    return true
  }

  const diaAnteriorIndex = diaActualIndex === 0 ? 6 : diaActualIndex - 1
  const diaAnterior = dias[diaAnteriorIndex]
  const horarioAyer = configGlobal.horarios.find(h => h.dia === diaAnterior)

  if(horarioAyer && rangoExtendidoDesdeAyer(horarioAyer.rangos || [], minutosActuales)){
    return true
  }

  return false
}

function convertirHoraAMinutos(texto){
  if(!texto || !texto.includes(":")) return null

  const partes = texto.split(":").map(Number)

  if(partes.length !== 2) return null

  const [hora, minuto] = partes

  if(
    Number.isNaN(hora) ||
    Number.isNaN(minuto) ||
    hora < 0 ||
    hora > 23 ||
    minuto < 0 ||
    minuto > 59
  ){
    return null
  }

  return hora * 60 + minuto
}

function rangoActivoEnDia(rangos, minutosActuales){
  for(const rango of rangos){
    const [inicioTexto, finTexto] = rango.split("-")
    const inicio = convertirHoraAMinutos(inicioTexto)
    const fin = convertirHoraAMinutos(finTexto)

    if(inicio === null || fin === null) continue

    if(fin > inicio){
      if(minutosActuales >= inicio && minutosActuales <= fin){
        return true
      }
    }else{
      if(minutosActuales >= inicio){
        return true
      }
    }
  }

  return false
}

function rangoExtendidoDesdeAyer(rangos, minutosActuales){
  for(const rango of rangos){
    const [inicioTexto, finTexto] = rango.split("-")
    const inicio = convertirHoraAMinutos(inicioTexto)
    const fin = convertirHoraAMinutos(finTexto)

    if(inicio === null || fin === null) continue

    if(fin <= inicio){
      if(minutosActuales <= fin){
        return true
      }
    }
  }

  return false
}

function actualizarEstadoNegocio(){
  let boton = obtenerElemento("btnHorarios")
  if(!boton) return

  boton.classList.remove("estadoAbierto", "estadoCerrado")

  if(negocioAbierto()){
    boton.innerText = "Abierto"
    boton.classList.add("estadoAbierto")
  }else{
    boton.innerText = "Cerrado"
    boton.classList.add("estadoCerrado")
  }
}

function abrirProducto(index, itemCarrito = null, indiceCarrito = null){
  productoActual = productosGlobal[index]
  if(!productoActual) return

  indiceEditandoCarrito = indiceCarrito

  obtenerElemento("modalNombre").innerText = productoActual.nombre
  obtenerElemento("modalDescripcion").innerText = productoActual.descripcion || ""

  let imagen = productoActual.imagen ? productoActual.imagen : "Images/producto-default.png"
  obtenerElemento("modalImagen").src = imagen

  let cantidadInput = obtenerElemento("cantidadProducto")
  let comentarioInput = obtenerElemento("comentarioProducto")
  let extrasContainer = obtenerElemento("extrasContainer")
  let botonAccion = document.querySelector('#modalProducto .modal-content button:not(.cancelar)')
  let bloqueExtras = obtenerElemento("bloqueExtras")

  cantidadInput.value = itemCarrito ? itemCarrito.cantidad : 1
  comentarioInput.value = itemCarrito ? itemCarrito.comentario || "" : ""

  extrasContainer.innerHTML = ""

  if(productoActual.extras && productoActual.extras.length > 0){
    if(bloqueExtras){
      bloqueExtras.style.display = "block"
    }

    productoActual.extras.forEach((extra, indexExtra) => {
      const tipo = obtenerTipoExtra(extra)

      let extraGuardado = null

      if(itemCarrito && itemCarrito.extras){
        extraGuardado = itemCarrito.extras.find(extraSeleccionado => extraSeleccionado.nombre === extra.nombre)
      }

      if(tipo === "cantidad"){
        let cantidadInicial = extraGuardado ? (extraGuardado.cantidad || 0) : 0
        let maximo = parseInt(extra.max)

        if(Number.isNaN(maximo) || maximo < 0){
          maximo = 99
        }

        extrasContainer.innerHTML += `
          <div class="extra-item">
            <div class="extra-left">
              <span>${extra.nombre}</span>
            </div>

            <div class="extra-cantidad-controles">
              <button
                type="button"
                class="extra-cantidad-btn"
                onclick="cambiarCantidadExtra(${indexExtra}, -1)"
              >−</button>

              <span class="extra-cantidad-valor" id="extra-cantidad-valor-${indexExtra}">
                ${cantidadInicial}
              </span>

              <button
                type="button"
                class="extra-cantidad-btn"
                onclick="cambiarCantidadExtra(${indexExtra}, 1)"
              >+</button>

              <span class="extra-precio">+${moneda}${extra.precio}</span>

              <input
                type="hidden"
                class="extra-cantidad-input"
                data-index="${indexExtra}"
                value="${cantidadInicial}"
                data-max="${maximo}"
              >
            </div>
          </div>
        `
      }else{
        let marcado = false

        if(extraGuardado){
          marcado = true
        }

        extrasContainer.innerHTML += `
          <div class="extra-item">
            <div class="extra-left">
              <input
                type="checkbox"
                value="${indexExtra}"
                onchange="actualizarPrecioModal()"
                ${marcado ? "checked" : ""}
              >
              <span>${extra.nombre}</span>
            </div>
            <span>+${moneda}${extra.precio}</span>
          </div>
        `
      }
    })
  }else{
    if(bloqueExtras){
      bloqueExtras.style.display = "none"
    }
  }

  if(botonAccion){
    botonAccion.innerText = itemCarrito ? "Guardar cambios" : "Agregar al carrito"
  }

  actualizarPrecioModal()
  obtenerElemento("modalProducto").style.display = "flex"
  bloquearScrollPagina()
}

function editarProductoCarrito(indexCarrito){
  let item = carrito[indexCarrito]
  if(!item) return

  let indexProductoReal = productosGlobal.findIndex(producto => producto.nombre === item.nombre)

  if(indexProductoReal === -1){
    alert("No se pudo encontrar el producto original para editarlo")
    return
  }

  abrirProducto(indexProductoReal, item, indexCarrito)
}

function actualizarPrecioModal(){
  if(!productoActual) return

  let precio = productoActual.precio
  let cantidad = parseInt(obtenerElemento("cantidadProducto").value) || 1

  if(productoActual.extras && productoActual.extras.length > 0){
    productoActual.extras.forEach((extra, indexExtra) => {
      const tipo = obtenerTipoExtra(extra)

      if(tipo === "cantidad"){
        const inputCantidad = document.querySelector(`.extra-cantidad-input[data-index="${indexExtra}"]`)
        const valorVisual = document.getElementById(`extra-cantidad-valor-${indexExtra}`)
        const cantidadExtra = parseInt(inputCantidad?.value) || 0

        if(valorVisual){
          valorVisual.innerText = cantidadExtra
        }

        precio += extra.precio * cantidadExtra
      }else{
        const checkbox = document.querySelector(`#extrasContainer input[type="checkbox"][value="${indexExtra}"]`)
        if(checkbox && checkbox.checked){
          precio += extra.precio
        }
      }
    })
  }

  precio = precio * cantidad
  obtenerElemento("precioModal").innerText = "Precio: " + moneda + precio
}

document.addEventListener("input", function(e){
  if(e.target.id === "cantidadProducto"){
    actualizarPrecioModal()
  }

  if(e.target.id === "telefonoCliente"){
    e.target.value = e.target.value.replace(/\D/g, "")
  }

  if(e.target.id === "nombreCliente"){
    e.target.value = e.target.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, "")
  }
})

function obtenerTipoExtra(extra){
  return extra?.tipo === "cantidad" ? "cantidad" : "check"
}

function cambiarCantidadExtra(indexExtra, delta){
  if(!productoActual || !productoActual.extras || !productoActual.extras[indexExtra]) return

  const extra = productoActual.extras[indexExtra]
  const input = document.querySelector(`.extra-cantidad-input[data-index="${indexExtra}"]`)
  if(!input) return

  let valorActual = parseInt(input.value) || 0
  let maximo = parseInt(extra.max)

  if(Number.isNaN(maximo) || maximo < 0){
    maximo = 99
  }

  valorActual += delta

  if(valorActual < 0){
    valorActual = 0
  }

  if(valorActual > maximo){
    valorActual = maximo
  }

  input.value = valorActual
  actualizarPrecioModal()
}

function obtenerExtrasSeleccionadosDesdeModal(){
  if(!productoActual || !productoActual.extras) return []

  const extrasSeleccionados = []

  productoActual.extras.forEach((extra, indexExtra) => {
    const tipo = obtenerTipoExtra(extra)

    if(tipo === "cantidad"){
      const inputCantidad = document.querySelector(`.extra-cantidad-input[data-index="${indexExtra}"]`)
      const cantidad = parseInt(inputCantidad?.value) || 0

      if(cantidad > 0){
        extrasSeleccionados.push({
          nombre: extra.nombre,
          precio: extra.precio,
          tipo: "cantidad",
          cantidad: cantidad
        })
      }
    }else{
      const checkbox = document.querySelector(`#extrasContainer input[type="checkbox"][value="${indexExtra}"]`)

      if(checkbox && checkbox.checked){
        extrasSeleccionados.push({
          nombre: extra.nombre,
          precio: extra.precio,
          tipo: "check",
          cantidad: 1
        })
      }
    }
  })

  return extrasSeleccionados
}

function cerrarModal(){
  obtenerElemento("modalProducto").style.display = "none"
  indiceEditandoCarrito = null

  let buscadorOverlay = obtenerElemento("buscadorOverlay")
  let buscadorSigueAbierto = buscadorOverlay && buscadorOverlay.classList.contains("abierto")

  if(!buscadorSigueAbierto){
    desbloquearScrollPagina()
  }

  let botonAccion = document.querySelector('#modalProducto .modal-content button:not(.cancelar)')
  if(botonAccion){
    botonAccion.innerText = "Agregar al carrito"
  }
}

function agregarDesdeModal(){
  if(!productoActual) return

  let cantidad = parseInt(obtenerElemento("cantidadProducto").value) || 1
  let extrasSeleccionados = obtenerExtrasSeleccionadosDesdeModal()
  let comentario = obtenerElemento("comentarioProducto").value.trim()

  let itemArmado = {
    nombre: productoActual.nombre,
    precioBase: productoActual.precio,
    extras: extrasSeleccionados,
    cantidad: cantidad,
    comentario: comentario
  }

  if(indiceEditandoCarrito !== null){
    carrito[indiceEditandoCarrito] = itemArmado
  }else{
    carrito.push(itemArmado)
  }

  cerrarModal()
  actualizarCarrito()
}

function aplicarTema(){
  if(!configGlobal.tema) return

  const root = document.documentElement
  const tema = configGlobal.tema

  const mapa = {

    "--logos-header-ancho": tema.logos?.headerAncho,
    "--logos-header-alto": tema.logos?.headerAlto,
    "--logos-header-offset-x": tema.logos?.logoOffsetX,
    "--logos-header-offset-x-mobile": tema.logos?.logoOffsetXMobile,
    "--header-titulo-offset-x": tema.logos?.tituloOffsetX,
    "--header-titulo-offset-x-mobile": tema.logos?.tituloOffsetXMobile,
    "--header-titulo-size-mobile": tema.logos?.tituloSizeMobile,

    "--logos-mobile-header-ancho": tema.logos?.mobileHeaderAncho,
    "--logos-mobile-header-alto": tema.logos?.mobileHeaderAlto,

    "--logos-pantalla-carga-ancho": tema.logos?.pantallaCargaAncho,
    "--logos-pantalla-carga-alto": tema.logos?.pantallaCargaAlto,

    "--logos-pantalla-alta-carga-ancho": tema.logos?.pantallaAltaCargaAncho,
    "--logos-pantalla-alta-carga-alto": tema.logos?.pantallaAltaCargaAlto,

    "--logos-desktop-grande-carga-ancho": tema.logos?.desktopGrandeCargaAncho,
    "--logos-desktop-grande-carga-alto": tema.logos?.desktopGrandeCargaAlto,

    "--general-color-texto-principal": tema.general?.colorTextoPrincipal,
    "--general-color-texto-secundario": tema.general?.colorTextoSecundario,
    "--general-color-texto-claro": tema.general?.colorTextoClaro,
    "--general-color-texto-modal": tema.general?.colorTextoModal,
    "--general-color-precio": tema.general?.colorPrecio,
    "--general-color-fondo-pagina": tema.general?.colorFondoPagina,
    "--general-color-fondo-contenedor": tema.general?.colorFondoContenedor,
    "--general-color-fondo-secciones": tema.general?.colorFondoSecciones,
    "--general-color-fondo-suave": tema.general?.colorFondoSuave,
    "--general-color-fondo-suave-hover": tema.general?.colorFondoSuaveHover,
    "--general-color-overlay-modal": tema.general?.colorOverlayModal,

    "--header-color-fondo": tema.header?.colorFondo,
    "--header-color-texto-titulo": tema.header?.colorTextoTitulo,
    "--header-sombra": tema.header?.sombra,

    "--botones-header-color-fondo-horarios": tema.botonesHeader?.colorFondoHorarios,
    "--botones-header-color-texto-horarios": tema.botonesHeader?.colorTextoHorarios,
    "--botones-header-color-borde-horarios": tema.botonesHeader?.colorBordeHorarios,
    "--botones-header-grosor-borde-horarios": tema.botonesHeader?.grosorBordeHorarios,

    "--botones-header-color-fondo-buscar": tema.botonesHeader?.colorFondoBuscar,
    "--botones-header-color-texto-buscar": tema.botonesHeader?.colorTextoBuscar,
    "--botones-header-color-borde-buscar": tema.botonesHeader?.colorBordeBuscar,
    "--botones-header-grosor-borde-buscar": tema.botonesHeader?.grosorBordeBuscar,

    "--botones-header-color-fondo-maps": tema.botonesHeader?.colorFondoMaps,
    "--botones-header-color-texto-maps": tema.botonesHeader?.colorTextoMaps,
    "--botones-header-color-borde-maps": tema.botonesHeader?.colorBordeMaps,
    "--botones-header-grosor-borde-maps": tema.botonesHeader?.grosorBordeMaps,

    "--botones-header-color-fondo-carrito": tema.botonesHeader?.colorFondoCarrito,
    "--botones-header-color-texto-carrito": tema.botonesHeader?.colorTextoCarrito,
    "--botones-header-color-borde-carrito": tema.botonesHeader?.colorBordeCarrito,
    "--botones-header-grosor-borde-carrito": tema.botonesHeader?.grosorBordeCarrito,

    "--botones-header-color-contador-fondo": tema.botonesHeader?.colorContadorFondo,
    "--botones-header-color-contador-texto": tema.botonesHeader?.colorContadorTexto,
    "--botones-header-sombra-contador": tema.botonesHeader?.sombraContador,

    "--estado-negocio-color-fondo-abierto": tema.estadoNegocio?.colorFondoAbierto,
    "--estado-negocio-color-texto-abierto": tema.estadoNegocio?.colorTextoAbierto,
    "--estado-negocio-color-fondo-cerrado": tema.estadoNegocio?.colorFondoCerrado,
    "--estado-negocio-color-texto-cerrado": tema.estadoNegocio?.colorTextoCerrado,

    "--slider-color-fondo": tema.slider?.colorFondo,
    "--slider-color-borde-inferior": tema.slider?.colorBordeInferior,
    "--slider-grosor-borde-inferior": tema.slider?.grosorBordeInferior,
    "--slider-color-borde-imagen": tema.slider?.colorBordeImagen,
    "--slider-grosor-borde-imagen": tema.slider?.grosorBordeImagen,
    "--slider-sombra-imagen": tema.slider?.sombraImagen,

    "--categorias-color-fondo-seccion": tema.categorias?.colorFondoSeccion,
    "--categorias-color-borde-inferior": tema.categorias?.colorBordeInferior,
    "--categorias-grosor-borde-inferior": tema.categorias?.grosorBordeInferior,
    "--categorias-color-fondo-boton": tema.categorias?.colorFondoBoton,
    "--categorias-color-fondo-boton-hover": tema.categorias?.colorFondoBotonHover,
    "--categorias-color-texto-boton": tema.categorias?.colorTextoBoton,
    "--categorias-color-borde-boton": tema.categorias?.colorBordeBoton,
    "--categorias-grosor-borde-boton": tema.categorias?.grosorBordeBoton,

    "--productos-color-fondo-card": tema.productos?.colorFondoCard,
    "--productos-color-texto-nombre": tema.productos?.colorTextoNombre,
    "--productos-color-texto-descripcion": tema.productos?.colorTextoDescripcion,
    "--productos-color-precio": tema.productos?.colorPrecio,
    "--productos-color-borde-card": tema.productos?.colorBordeCard,
    "--productos-grosor-borde-card": tema.productos?.grosorBordeCard,
    "--productos-color-borde-card-activo": tema.productos?.colorBordeCardActivo,
    "--productos-grosor-borde-card-activo": tema.productos?.grosorBordeCardActivo,
    "--productos-sombra-card": tema.productos?.sombraCard,
    "--productos-color-estado-disponible": tema.productos?.colorEstadoDisponible,
    "--productos-color-estado-agotado": tema.productos?.colorEstadoAgotado,

    "--carrito-color-fondo": tema.carrito?.colorFondo,
    "--carrito-color-texto": tema.carrito?.colorTexto,
    "--carrito-color-borde": tema.carrito?.colorBorde,
    "--carrito-grosor-borde": tema.carrito?.grosorBorde,
    "--carrito-color-separador-items": tema.carrito?.colorSeparadorItems,
    "--carrito-grosor-separador-items": tema.carrito?.grosorSeparadorItems,
    "--carrito-sombra": tema.carrito?.sombra,

    "--botones-color-fondo-principal": tema.botones?.colorFondoPrincipal,
    "--botones-color-texto-principal": tema.botones?.colorTextoPrincipal,
    "--botones-color-borde-principal": tema.botones?.colorBordePrincipal,
    "--botones-grosor-borde-principal": tema.botones?.grosorBordePrincipal,

    "--botones-color-fondo-secundario": tema.botones?.colorFondoSecundario,
    "--botones-color-texto-secundario": tema.botones?.colorTextoSecundario,
    "--botones-color-borde-secundario": tema.botones?.colorBordeSecundario,
    "--botones-grosor-borde-secundario": tema.botones?.grosorBordeSecundario,

    "--botones-color-fondo-cancelar": tema.botones?.colorFondoCancelar,
    "--botones-color-texto-cancelar": tema.botones?.colorTextoCancelar,
    "--botones-color-borde-cancelar": tema.botones?.colorBordeCancelar,
    "--botones-grosor-borde-cancelar": tema.botones?.grosorBordeCancelar,

    "--botones-color-fondo-eliminar": tema.botones?.colorFondoEliminar,
    "--botones-color-texto-eliminar": tema.botones?.colorTextoEliminar,
    "--botones-color-borde-eliminar": tema.botones?.colorBordeEliminar,
    "--botones-grosor-borde-eliminar": tema.botones?.grosorBordeEliminar,

    "--modal-color-fondo": tema.modal?.colorFondo,
    "--modal-color-texto-titulo": tema.modal?.colorTextoTitulo,
    "--modal-color-texto-contenido": tema.modal?.colorTextoContenido,
    "--modal-color-borde-horarios": tema.modal?.colorBordeHorarios,
    "--modal-grosor-borde-horarios": tema.modal?.grosorBordeHorarios,
    "--modal-sombra": tema.modal?.sombra,

    "--extras-color-fondo-item": tema.extras?.colorFondoItem,
    "--extras-color-fondo-item-hover": tema.extras?.colorFondoItemHover,
    "--extras-color-texto": tema.extras?.colorTexto,

    "--formularios-color-fondo-input": tema.formularios?.colorFondoInput,
    "--formularios-color-texto-input": tema.formularios?.colorTextoInput,
    "--formularios-color-borde-input": tema.formularios?.colorBordeInput,
    "--formularios-grosor-borde-input": tema.formularios?.grosorBordeInput,
    "--formularios-color-fondo-textarea": tema.formularios?.colorFondoTextarea,
    "--formularios-color-texto-textarea": tema.formularios?.colorTextoTextarea,
    "--formularios-color-borde-textarea": tema.formularios?.colorBordeTextarea,
    "--formularios-grosor-borde-textarea": tema.formularios?.grosorBordeTextarea,
    "--formularios-color-fondo-select": tema.formularios?.colorFondoSelect,
    "--formularios-color-texto-select": tema.formularios?.colorTextoSelect,
    "--formularios-color-borde-select": tema.formularios?.colorBordeSelect,
    "--formularios-grosor-borde-select": tema.formularios?.grosorBordeSelect,
    "--formularios-color-fondo-resumen": tema.formularios?.colorFondoResumen,
    "--formularios-color-texto-resumen": tema.formularios?.colorTextoResumen,

    "--footer-color-fondo": tema.footer?.colorFondo,
    "--footer-color-texto-titulo": tema.footer?.colorTextoTitulo,
    "--footer-color-texto-copy": tema.footer?.colorTextoCopy,

    "--pantalla-carga-color-fondo": tema.pantallaCarga?.colorFondo,
    "--pantalla-carga-color-texto": tema.pantallaCarga?.colorTexto,

    "--boton-flotante-color-fondo": tema.botonFlotante?.colorFondo,
    "--boton-flotante-color-texto": tema.botonFlotante?.colorTexto,
    "--boton-flotante-color-borde": tema.botonFlotante?.colorBorde,
    "--boton-flotante-grosor-borde": tema.botonFlotante?.grosorBorde,
    "--boton-flotante-sombra": tema.botonFlotante?.sombra,

    "--bordes-radio-botones": tema.bordes?.radioBotones,
    "--bordes-radio-boton-flotante": tema.bordes?.radioBotonFlotante,
    "--bordes-radio-cards": tema.bordes?.radioCards,
    "--bordes-radio-imagenes": tema.bordes?.radioImagenes,
    "--bordes-radio-inputs": tema.bordes?.radioInputs,
    "--bordes-radio-modal": tema.bordes?.radioModal,
    "--bordes-radio-items-extras": tema.bordes?.radioItemsExtras,
    "--bordes-radio-categorias": tema.bordes?.radioCategorias,
    "--bordes-radio-carrito": tema.bordes?.radioCarrito,

    "--buscador-color-overlay": tema.buscador?.colorOverlay,
    "--buscador-color-input-fondo": tema.buscador?.colorInputFondo,
    "--buscador-color-input-texto": tema.buscador?.colorInputTexto,
    "--buscador-color-input-borde": tema.buscador?.colorInputBorde,
    "--buscador-grosor-borde-input": tema.buscador?.grosorBordeInput,

    "--buscador-color-boton-volver-fondo": tema.buscador?.colorBotonVolverFondo,
    "--buscador-color-boton-volver-texto": tema.buscador?.colorBotonVolverTexto,
    "--buscador-color-boton-volver-borde": tema.buscador?.colorBotonVolverBorde,
    "--buscador-grosor-borde-boton-volver": tema.buscador?.grosorBordeBotonVolver,

    "--buscador-color-item-fondo": tema.buscador?.colorItemFondo,
    "--buscador-color-item-fondo-hover": tema.buscador?.colorItemFondoHover,
    "--buscador-color-item-borde": tema.buscador?.colorItemBorde,
    "--buscador-grosor-borde-item": tema.buscador?.grosorBordeItem,
    "--buscador-color-item-texto": tema.buscador?.colorItemTexto,
    "--buscador-color-item-descripcion": tema.buscador?.colorItemDescripcion,
    "--buscador-color-item-precio": tema.buscador?.colorItemPrecio,
    "--buscador-color-texto-vacio": tema.buscador?.colorTextoVacio,
  }

  Object.entries(mapa).forEach(([variable, valor]) => {
    if(valor !== undefined && valor !== null && valor !== ""){
      root.style.setProperty(variable, valor)
    }
  })
}

function bloquearScrollPagina(){
  scrollPosicion = window.scrollY || window.pageYOffset
  document.documentElement.classList.add("no-scroll")
  document.body.classList.add("no-scroll")
  document.body.style.top = `-${scrollPosicion}px`
  activarBloqueoTouch()
}

function desbloquearScrollPagina(){
  document.documentElement.classList.remove("no-scroll")
  document.body.classList.remove("no-scroll")
  document.body.style.top = ""
  window.scrollTo(0, scrollPosicion)
  desactivarBloqueoTouch()
}

function actualizarCarrito(){
  let lista = obtenerElemento("listaCarrito")
  lista.innerHTML = ""

  carrito.forEach((item, index) => {
    let precioItem = calcularPrecioItem(item)
    let li = document.createElement("li")
    let extrasTexto = ""
    let comentario = item.comentario ? `<div class="carrito-comentario"><i>${item.comentario}</i></div>` : ""

    item.extras.forEach(extra => {
      if((extra.cantidad || 1) > 1){
        extrasTexto += ` + ${extra.nombre} x${extra.cantidad}`
      }else{
        extrasTexto += ` + ${extra.nombre}`
      }
    })

    li.innerHTML = `
      <div class="carrito-item">
        <div class="carrito-item-info">
          <div class="carrito-item-texto">
            ${item.nombre}${extrasTexto} x${item.cantidad} - ${moneda}${precioItem}
          </div>
          ${comentario}
        </div>

        <div class="carrito-item-acciones">
          <button type="button" class="btnEditarItem" onclick="editarProductoCarrito(${index})">
            Editar
          </button>
          <button type="button" class="btnEliminarItem" onclick="eliminarProducto(${index})">
            Eliminar
          </button>
        </div>
      </div>
    `

    lista.appendChild(li)
  })

  obtenerElemento("total").innerText = moneda + calcularTotalCarrito()
  actualizarBotonPedidoFlotante()
  actualizarContadorCarrito()
  ajustarBotonFlotanteConFooter()
}

function eliminarProducto(index){
  carrito.splice(index, 1)
  actualizarCarrito()
}

function finalizarPedido(){

  if(!negocioAbierto()){
    let nombre = configGlobal?.nombreNegocio || "El negocio"
    alert(`${nombre} está cerrado en este momento, revisá los días y horarios de apertura`)
    return
  }

  if(carrito.length === 0){
    alert("Tu carrito está vacío")
    return
  }

  mostrarCheckout()
}

function mostrarCheckout(){
  let resumen = obtenerElemento("resumenPedido")
  let total = 0

  resumen.innerHTML = ""

  carrito.forEach(item => {
    let precio = item.precioBase
    let extrasTexto = ""

    item.extras.forEach(extra => {
      let cantidadExtra = extra.cantidad || 1
      precio += extra.precio * cantidadExtra

      if(cantidadExtra > 1){
        extrasTexto += ` + ${extra.nombre} x${cantidadExtra}`
      }else{
        extrasTexto += ` + ${extra.nombre}`
      }
    })

    precio = precio * item.cantidad
    total += precio

    resumen.innerHTML += `
      ${item.cantidad}x ${item.nombre}${extrasTexto}
      - ${moneda}${precio}<br>
    `
  })

  obtenerElemento("totalFinal").innerText = "Total: " + moneda + total
  obtenerElemento("checkoutModal").style.display = "flex"
  bloquearScrollPagina()

  cambiarEntrega()
  cambiarPago()
}

function cerrarCheckout(){
  obtenerElemento("checkoutModal").style.display = "none"

  let buscadorOverlay = obtenerElemento("buscadorOverlay")
  let buscadorSigueAbierto = buscadorOverlay && buscadorOverlay.classList.contains("abierto")

  if(!buscadorSigueAbierto){
    desbloquearScrollPagina()
  }
}

function actualizarAlturaHeader(){
  const topbar = document.querySelector(".topbar")
  if(!topbar) return

  document.documentElement.style.setProperty(
    "--layout-alto-header",
    `${topbar.offsetHeight}px`
  )
}

function cambiarPago(){
  let select = obtenerElemento("formaPago")
  let contenedor = obtenerElemento("efectivoContainer")

  if(!select || !contenedor) return

  let opcionSeleccionada = select.options[select.selectedIndex]
  let requierePagaCon = opcionSeleccionada.dataset.requierePagaCon === "true"

  contenedor.style.display = requierePagaCon ? "block" : "none"
}

function cambiarEntrega(){
  let select = obtenerElemento("tipoEntrega")
  let direccion = obtenerElemento("direccionContainer")

  if(!select || !direccion) return

  let opcionSeleccionada = select.options[select.selectedIndex]
  let requiereDireccion = opcionSeleccionada.dataset.requiereDireccion === "true"

  direccion.style.display = requiereDireccion ? "block" : "none"
}

function validarCheckout(nombre, telefonoCli, entrega, direccion, pago, pagaCon){
  if(nombre.trim() === ""){
    alert("Ingresá tu nombre")
    return false
  }

  if(telefonoCli.trim() === ""){
    alert("Ingresá tu teléfono")
    return false
  }

  if(telefonoCli.trim().length < 6){
    alert("Ingresá un teléfono válido")
    return false
  }

  let tipoEntrega = obtenerElemento("tipoEntrega")
  let opcionEntrega = tipoEntrega.options[tipoEntrega.selectedIndex]
  let requiereDireccion = opcionEntrega.dataset.requiereDireccion === "true"

  if(requiereDireccion && direccion.trim() === ""){
    alert("Ingresá la dirección de entrega")
    return false
  }

  let formaPago = obtenerElemento("formaPago")
  let opcionPago = formaPago.options[formaPago.selectedIndex]
  let requierePagaCon = opcionPago.dataset.requierePagaCon === "true"

  if(requierePagaCon && pagaCon.trim() === ""){
    alert("Ingresá con cuánto pagás")
    return false
  }

  return true
}

function abrirBuscador(){
  let overlay = obtenerElemento("buscadorOverlay")
  let input = obtenerElemento("inputBuscador")

  if(!overlay || !input) return

  overlay.classList.add("abierto")
  bloquearScrollPagina()

  textoBusquedaActual = ""
  input.value = ""
  renderizarResultadosBusqueda([])

  setTimeout(() => {
    input.focus()
  }, 50)
}

function cerrarBuscador(){
  let overlay = obtenerElemento("buscadorOverlay")
  let input = obtenerElemento("inputBuscador")
  let resultados = obtenerElemento("resultadosBuscador")

  if(overlay){
    overlay.classList.remove("abierto")
  }

  if(input){
    input.value = ""
  }

  if(resultados){
    resultados.innerHTML = ""
  }

  textoBusquedaActual = ""
  resultadosBusquedaActual = []
  desbloquearScrollPagina()
}

function normalizarTexto(texto){
  return (texto || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function obtenerTextoBusquedaProducto(producto){
  let extrasTexto = ""

  if(producto.extras && producto.extras.length > 0){
    extrasTexto = producto.extras.map(extra => extra.nombre).join(" ")
  }

  return normalizarTexto(`
    ${producto.nombre || ""}
    ${producto.descripcion || ""}
    ${producto.categoria || ""}
    ${extrasTexto}
  `)
}

function buscarProductos(texto){
  let textoNormalizado = normalizarTexto(texto)

  if(!textoNormalizado){
    return []
  }

  return productosGlobal.filter(producto => {
    let textoProducto = obtenerTextoBusquedaProducto(producto)
    return textoProducto.includes(textoNormalizado)
  })
}

function renderizarResultadosBusqueda(productos){
  let contenedor = obtenerElemento("resultadosBuscador")
  if(!contenedor) return

  contenedor.innerHTML = ""

  let mostrarDescripcion = configGlobal?.tema?.productos?.mostrarDescripcionPreview !== false

  if(textoBusquedaActual.trim() === ""){
    contenedor.innerHTML = `
      <div class="buscadorVacio">
        Escribí para buscar productos.
      </div>
    `
    return
  }

  if(productos.length === 0){
    contenedor.innerHTML = `
      <div class="buscadorVacio">
        No se encontraron productos para "${textoBusquedaActual}".
      </div>
    `
    return
  }

  let lista = document.createElement("div")
  lista.classList.add("buscadorLista")

  productos.forEach(producto => {
    let item = document.createElement("div")
    let disponible = producto.disponible !== false
    let indiceReal = productosGlobal.indexOf(producto)
    let imagen = producto.imagen ? producto.imagen : "Images/producto-default.png"

    item.classList.add("buscadorItem")

    if(!disponible){
      item.classList.add("buscadorItemAgotado")
    }

    if(disponible){
      item.addEventListener("click", () => {
        abrirProducto(indiceReal)
      })
    }

    item.innerHTML = `
      <div class="buscadorItemInfo">
        ${disponible
          ? '<span class="estadoProducto disponible">Disponible</span>'
          : '<span class="estadoProducto agotado">Agotado</span>'
        }
        <h3>${producto.nombre}</h3>
        ${mostrarDescripcion && producto.descripcion
          ? `<p class="buscadorItemDescripcion">${producto.descripcion}</p>`
          : ""
        }
      </div>

      <div class="buscadorItemDerecha">
        <img src="${imagen}" class="buscadorItemImg" alt="${producto.nombre}">
        <p class="buscadorItemPrecio">${moneda}${producto.precio}</p>
      </div>
    `

    lista.appendChild(item)
  })

  contenedor.appendChild(lista)
}

function manejarInputBuscador(e){
  textoBusquedaActual = e.target.value || ""
  resultadosBusquedaActual = buscarProductos(textoBusquedaActual)
  renderizarResultadosBusqueda(resultadosBusquedaActual)
}

function confirmarPedido(){
  let nombre = obtenerElemento("nombreCliente").value
  let telefonoCli = obtenerElemento("telefonoCliente").value
  let direccion = obtenerElemento("direccionCliente").value
  let entrega = obtenerElemento("tipoEntrega").value
  let pago = obtenerElemento("formaPago").value
  let pagaCon = obtenerElemento("pagaCon").value
  let comentarioGeneral = obtenerElemento("comentariosPedido").value.trim()

  if(!validarCheckout(nombre, telefonoCli, entrega, direccion, pago, pagaCon)){
    return
  }

  let mensaje = `🛒 *Nuevo pedido* - ${configGlobal.nombreNegocio || "Pedido"}\n`
  mensaje += `━━━━━━━━━━━━━━\n\n`
  mensaje += `📦 *Productos:*\n`

  let total = 0

  carrito.forEach(item => {
    let precio = item.precioBase
    let extrasTexto = ""

    item.extras.forEach(extra => {
      let cantidadExtra = extra.cantidad || 1
      precio += extra.precio * cantidadExtra

      if(cantidadExtra > 1){
        extrasTexto += ` + ${extra.nombre} x${cantidadExtra}`
      }else{
        extrasTexto += ` + ${extra.nombre}`
      }
    })

    precio = precio * item.cantidad
    total += precio

    mensaje += `• *${item.cantidad}x* ${item.nombre}${extrasTexto}\n`
    mensaje += `  _Subtotal:_ ${moneda}${precio}\n`

    if(item.comentario){
      mensaje += `  📝 _Comentario:_ ${item.comentario}\n`
    }

    mensaje += `\n`
  })

  mensaje += `💵 *Total:* ${moneda}${total}\n\n`

  if(comentarioGeneral){
    mensaje += `📝 *Comentarios del pedido:*\n${comentarioGeneral}\n\n`
  }

  mensaje += `🚚 *Entrega:* ${entrega}\n`

  let tipoEntrega = obtenerElemento("tipoEntrega")
  let opcionEntrega = tipoEntrega.options[tipoEntrega.selectedIndex]
  let requiereDireccion = opcionEntrega.dataset.requiereDireccion === "true"

  if(requiereDireccion){
    mensaje += `📍 *Dirección:* ${direccion}\n`
  }

  mensaje += `\n👤 *Datos del cliente:*\n`
  mensaje += `*Nombre:* ${nombre}\n`
  mensaje += `*Teléfono:* ${telefonoCli}\n`

  mensaje += `\n💳 *Método de pago:* ${pago}\n`

  let formaPago = obtenerElemento("formaPago")
  let opcionPago = formaPago.options[formaPago.selectedIndex]
  let requierePagaCon = opcionPago.dataset.requierePagaCon === "true"

  if(requierePagaCon){
    mensaje += `💰 *Paga con:* ${moneda}${pagaCon}\n`
  }

  let url = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`
  window.open(url, "_blank")
  cerrarCheckout()
}

window.addEventListener("load", async () => {
  mostrarPantallaCarga()

  await cargarConfig()
  await cargarProductos()
  crearSliderInfinito()
  actualizarBotonPedidoFlotante()
  actualizarContadorCarrito()

  actualizarAlturaHeader()
  requestAnimationFrame(actualizarAlturaHeader)
  setTimeout(actualizarAlturaHeader, 100)

  ajustarBotonFlotanteConFooter()
  actualizarEstadoNegocio()

  let inputBuscador = obtenerElemento("inputBuscador")
  if(inputBuscador){
    inputBuscador.addEventListener("input", manejarInputBuscador)
  }

  bloquearScrollPagina();
  setInterval(actualizarEstadoNegocio, 60000)

  setTimeout(() => {
    ocultarPantallaCarga()
    desbloquearScrollPagina()
    if(!negocioAbierto()){
      abrirHorarios()
    }
  }, 2750)
})

window.addEventListener("resize", () => {
  let anchoActual = window.innerWidth
  let cambioRealDeAncho = anchoActual !== ultimoAnchoVentana

  ajustarTituloNegocio()
  actualizarAlturaHeader()
  requestAnimationFrame(actualizarAlturaHeader)
  setTimeout(actualizarAlturaHeader, 50)

  if(cambioRealDeAncho){
    ultimoAnchoVentana = anchoActual

    let imagenes = configGlobal?.sliderImagenes || []
    if(imagenes.length >= 2){
      esperarImagenesSlider(() => {
        actualizarAnimacionSlider(imagenes.length)
      })
    }
  }

  ajustarBotonFlotanteConFooter()
})

window.addEventListener("resize", ajustarBotonFlotanteConFooter)
window.addEventListener("scroll", ajustarBotonFlotanteConFooter)

document.addEventListener("keydown", function(e){
  let overlay = obtenerElemento("buscadorOverlay")
  if(!overlay) return

  if(e.key === "Escape" && overlay.classList.contains("abierto")){
    cerrarBuscador()
  }
})