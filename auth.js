const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors'); 

dotenv.config();

const app = express();
const port = 3001;

const corsOptions = {
    origin: ['http://localhost:3000'], // Allow requests from this origin
    methods: ['GET', 'POST'], // Allow only GET and POST requests
  };
  
  app.use(cors(corsOptions));

app.use(express.json());

app.get('/repo-exists', async (req, res) => {
    const { username, repoName, accessToken } = req.query;
    try {
      const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      res.status(200).send({ exists: true });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        res.status(200).send({ exists: false });
      } else {
        res.status(500).send({ error: 'Error checking repository existence' });
      }
    }
  });
  
  // Endpoint to create a new repository
  app.post('/create-repo', async (req, res) => {
    const { username, repoName, accessToken } = req.body;
    try {
      const response = await axios.post(
        'https://api.github.com/user/repos',
        { name: repoName },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      res.status(201).send(response.data);
    } catch (error) {
      res.status(500).send({ error: 'Error creating repository' });
    }
  });

// Endpoint to initiate GitHub OAuth flow
app.get('/auth/github', (req, res) => {
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=http://localhost:3001/callback&scope=repo`;
  res.redirect(githubAuthUrl);
});

app.get('/', (req, res) => {
    res.message("get working")
  });
  
// Callback endpoint for GitHub OAuth
app.get('/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: 'http://localhost:3001/callback',
      },
      {
        headers: {
          accept: 'application/json',
        },
      }
    );
    const { access_token } = response.data;
    res.redirect(`http://localhost:3000?token=${access_token}`);
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).send('Internal Server Error');
  }
});

// Endpoint to exchange authorization code for access token
app.post('/exchange-code', async (req, res) => {
  const { code } = req.query;

  try {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: 'http://localhost:3001/callback',
      },
      {
        headers: {
          accept: 'application/json',
        },
      }
    );
    const { access_token } = response.data;
    res.json({ access_token });
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Endpoint to save code to GitHub repository
app.post('/save-code', async (req, res) => {
  const { username, repoName, filePath, commitMessage, code } = req.body;
  const { authorization } = req.headers;
  const accessToken = authorization.split(' ')[1];

  try {
    const response = await axios.put(
      `https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`,
      {
        message: commitMessage,
        content: code,
      },
      {
        headers: {
          Authorization: `token ${accessToken}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('Error saving code:', error);
    res.status(error.response.status).json({ error: error.response.statusText });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
