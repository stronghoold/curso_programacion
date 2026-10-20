const express = require("express")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.static("."))

const jugadores = []

// Un jugador que deja de dar senales (recarga, pestana cerrada o caida)
// se elimina para que no quede como enemigo fantasma en el mapa.
const INACTIVIDAD_MAXIMA_MS = 30000

function eliminarInactivos() {
  const limite = Date.now() - INACTIVIDAD_MAXIMA_MS

  for (let i = jugadores.length - 1; i >= 0; i--) {
    if (jugadores[i].ultimaActividad < limite) {
      jugadores.splice(i, 1)
    }
  }
}

class Jugador {
  constructor(id) {
    this.id = id
    this.mokepon = null
    this.x = null
    this.y = null
    this.ataques = []
    this.ultimaActividad = Date.now()
  }

  asignarMokepon(mokepon) {
    this.mokepon = mokepon
  }

  actualizarPosicion(x, y) {
    this.x = x
    this.y = y
  }

  asignarAtaques(ataques) {
    this.ataques = ataques
  }
}

class Mokepon {
  constructor(nombre) {
    this.nombre = nombre
  }
}

app.get("/", (req, res) => {
  res.redirect("/mokepon.html")
})

app.get("/unirse", (req, res) => {
  eliminarInactivos()

  const id = `${Math.random()}`

  const jugador = new Jugador(id)

  jugadores.push(jugador)

  res.send(id)
})

app.post("/mokepon/:jugadorId", (req, res) => {
  const jugadorId = req.params.jugadorId || ""
  const nombre = req.body.mokepon || ""
  const mokepon = new Mokepon(nombre)

  const jugadorIndex = jugadores.findIndex((jugador) => jugadorId === jugador.id)

  if (jugadorIndex >= 0) {
    jugadores[jugadorIndex].asignarMokepon(mokepon)
    jugadores[jugadorIndex].ultimaActividad = Date.now()
  }

  res.end()
})

app.post("/mokepon/:jugadorId/posicion", (req, res) => {
  const jugadorId = req.params.jugadorId || ""
  const x = Number(req.body.x)
  const y = Number(req.body.y)

  const jugadorIndex = jugadores.findIndex((jugador) => jugadorId === jugador.id)

  if (jugadorIndex >= 0) {
    jugadores[jugadorIndex].actualizarPosicion(
      Number.isFinite(x) ? x : null,
      Number.isFinite(y) ? y : null
    )
    jugadores[jugadorIndex].ultimaActividad = Date.now()
  }

  eliminarInactivos()

  // Solo devolvemos enemigos que ya eligieron mascota y tienen una posicion
  // valida; si no, el cliente intentaria dibujarlos/pintarlos con datos vacios.
  const enemigos = jugadores.filter(
    (jugador) =>
      jugadorId !== jugador.id &&
      jugador.mokepon !== null &&
      Number.isFinite(jugador.x) &&
      Number.isFinite(jugador.y)
  )

  res.send({
    enemigos
  })
})

app.post("/mokepon/:jugadorId/ataques", (req, res) => {
  const jugadorId = req.params.jugadorId || ""
  const ataques = req.body.ataques || []

  const jugadorIndex = jugadores.findIndex((jugador) => jugadorId === jugador.id)

  if (jugadorIndex >= 0) {
    jugadores[jugadorIndex].asignarAtaques(ataques)
    jugadores[jugadorIndex].ultimaActividad = Date.now()
  }

  res.end()
})

app.post("/mokepon/:jugadorId/desconectar", (req, res) => {
  const jugadorId = req.params.jugadorId || ""
  const jugadorIndex = jugadores.findIndex((jugador) => jugadorId === jugador.id)

  if (jugadorIndex >= 0) {
    jugadores.splice(jugadorIndex, 1)
  }

  res.end()
})

app.get("/mokepon/:jugadorId/ataques", (req, res) => {
  const jugadorId = req.params.jugadorId || ""
  const jugador = jugadores.find((jugador) => jugador.id === jugadorId)

  res.send({
    ataques: jugador ? jugador.ataques || [] : []
  })
})

app.listen(process.env.PORT || 8080, () => {
  console.log("Servidor funcionando en http://localhost:8080")
})
