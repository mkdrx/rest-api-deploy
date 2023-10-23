const express = require('express')
// To create IDs
const crypto = require('node:crypto')
const cors = require('cors')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json())
app.use(cors())
app.disable('x-powered-by')

// With methods like PUT/PATCH/DELETE we require:
// CORS PRE-Flight --> OPTIONS

// Get all movies
app.get('/movies', (req, res) => {
  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

// GET a movie
app.get('/movies/:id', (req, res) => {
  // find id and movie associated
  const { id } = req.params
  const movie = movies.find((movie) => movie.id === id)
  if (movie) return res.json(movie)
  res.status(404).json({ message: 'Movie not found' })
})

// POST
app.post('/movies', (req, res) => {
  // Validate
  const result = validateMovie(req.body)

  if (result.error) {
    // Could also use 422
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // What we'll do in DB
  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data,
  }

  // This would not be REST since we are saving the state into memory
  movies.push(newMovie)

  res.status(201).json(newMovie) // updates client's cache
})

// DELETE
app.delete('/movies/:id', (req, res) => {
  const { id } = req.params
  const movieIndex = movies.findIndex((movie) => movie.id === id)
  if (movieIndex === -1)
    return res.status(404).json({ message: 'Movie not found' })

  movies.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

// PATCH
app.patch('/movies/:id', (req, res) => {
  const { id } = req.params

  const result = validatePartialMovie(req.body)
  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  const movieIndex = movies.findIndex((movie) => movie.id === id)
  if (movieIndex === -1)
    return res.status(404).json({ message: 'Movie not found' })

  const updateMovie = {
    ...movies[movieIndex],
    ...result.data,
  }

  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

// Code below skipped after using cors dependency
/* // OPTIONS -> added for DELETE
app.options('/movies/:id', (req, res) => {
  // CORS and allowed methods
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE')

  // To send the petition
  res.send()
}) */

const PORT = process.env.PORT ?? 1234

app.listen(PORT, () => {
  console.log(`Server is listening on port http://localhost:${PORT}`)
})
