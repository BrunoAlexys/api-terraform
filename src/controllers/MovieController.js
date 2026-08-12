const MovieModel = require('../models/MovieModel');

class MovieController {
  async getAll(req, res) {
    try {
      const movies = await MovieModel.getAll();
      res.status(200).json(movies);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch movies' });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const movie = await MovieModel.getById(id);
      
      if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
      }
      
      res.status(200).json(movie);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to fetch movie' });
    }
  }

  async create(req, res) {
    try {
      const { title, director, year } = req.body;

      if (!title || !director || !year) {
        return res.status(400).json({ error: 'Title, director, and year are required' });
      }

      const newMovie = await MovieModel.create({ title, director, year });
      res.status(201).json(newMovie);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create movie' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      
      // Create an object with only the fields that were provided
      const updateData = {};
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.director !== undefined) updateData.director = req.body.director;
      if (req.body.year !== undefined) updateData.year = req.body.year;

      const updatedMovie = await MovieModel.updateWithCondition(id, updateData);
      
      if (!updatedMovie) {
        return res.status(404).json({ error: 'Movie not found' });
      }

      res.status(200).json(updatedMovie);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update movie' });
    }
  }

  async delete(req, res) {
    try {
      const { id } = req.params;
      const success = await MovieModel.delete(id);

      if (!success) {
        return res.status(404).json({ error: 'Movie not found' });
      }

      res.status(204).send();
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete movie' });
    }
  }
}

module.exports = new MovieController();
