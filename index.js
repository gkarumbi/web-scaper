const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

app.set('view engine', 'ejs');

app.get('/', async (req, res) => {
  try {
    const response = await axios.get('https://www.classcentral.com/subject/data-science');
    const $ = cheerio.load(response.data);
    const courses = [];

    $('.course-list .course-name').each((index, element) => {
      const courseName = $(element).text().trim();
      courses.push(courseName);
    });

    res.render('index', { courses });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(3000, () => {
  console.log('Server started on port 3000');
});
