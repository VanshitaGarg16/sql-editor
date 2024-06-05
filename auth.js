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
      const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}/contents/${filePath}`, {
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

  app.get('/get-username', async (req, res) => {
    const { accessToken } = req.query;
    try {
      const response = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      res.json({ username: response.data.login });
    } catch (error) {
      console.error('Error fetching username:', error);
      res.status(500).json({ error: 'Failed to fetch username' });
    }
  });

  app.get('/get-repos', async (req, res) => {
    const { accessToken } = req.query;
    try {
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      res.status(500).json({ error: 'Failed to fetch repositories' });
    }
  });
  
  app.get('/get-branches', async (req, res) => {
    const { username, repo, accessToken } = req.query;
    try {
      const response = await axios.get(`https://api.github.com/repos/${username}/${repo}/branches`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
      res.status(500).json({ error: 'Failed to fetch branches' });
    }
  });
  
  app.get('/get-files', async (req, res) => {
    const { username, repo, branch, accessToken } = req.query;
    try {
      const response = await axios.get(`https://api.github.com/repos/${username}/${repo}/git/trees/${branch}?recursive=1`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      res.json(response.data.tree.filter(item => item.type === 'blob'));
    } catch (error) {
      console.error('Error fetching files:', error);
      res.status(500).json({ error: 'Failed to fetch files' });
    }
  });
  
  app.get('/get-file-content', async (req, res) => {
    const { username, repo, branch, path, accessToken } = req.query;
    try {
      const response = await axios.get(`https://api.github.com/repos/${username}/${repo}/contents/${path}?ref=${branch}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      res.json(response.data);
    } catch (error) {
      console.error('Error fetching file content:', error);
      res.status(500).json({ error: 'Failed to fetch file content' });
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

app.post('/update-file', async (req, res) => {
  const { username, selectedRepo, selectedFile, code, commitMessage, accessToken } = req.body;

  try {
    // Fetch current file content
    const response = await axios.get(`https://api.github.com/repos/${username}/${selectedRepo}/contents/${selectedFile}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const fileData = response.data;

    // Update file content with new code
    const updatedContent = Buffer.from(code).toString('base64');

    // Create commit with updated file content
    const commitResponse = await axios.put(`https://api.github.com/repos/${username}/${selectedRepo}/contents/${selectedFile}`, {
      message: commitMessage,
      content: updatedContent,
      sha: fileData.sha, // SHA of the current file content
    }, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    // Push changes to GitHub
    await axios.post(`https://api.github.com/repos/${username}/${selectedRepo}/git/refs`, {
          ref: 'refs/heads/main', // Assuming you're pushing changes to the main branch
          sha: commitResponse.data.content.sha, // SHA of the new commit
      }, {
          headers: {
              Authorization: `Bearer ${accessToken}`,
          },
      });
    res.status(200).send('File updated and changes pushed to GitHub successfully!');
  } catch (error) {
    if (error.response && error.response.status === 422 && error.response.data.message === 'Reference already exists') {
        res.status(200).send('Reference already exists.');
    }
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
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
