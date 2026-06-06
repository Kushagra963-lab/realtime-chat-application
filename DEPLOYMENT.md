# Deployment

## GitHub

This project is ready to push as its own repository:

```bash
git init
git add .
git commit -m "Build MERN Socket.io chat app"
git branch -M main
git remote add origin https://github.com/<your-user>/realtime-chat-application.git
git push -u origin main
```

The project test/build commands are ready for GitHub Actions. If your token has `workflow` scope, add a workflow that runs `npm ci`, `npm run test -w server`, `npm run lint -w client`, and `npm run build -w client`.

## Render

1. Create a MongoDB Atlas cluster.
2. Create a Redis instance.
3. Create a Render Blueprint from this repository.
4. Set the environment variables from `.env.example`.
5. Set `CLIENT_URL` and `GOOGLE_OAUTH_REDIRECT` to the final Render URL.

The API service serves `client/dist`, so the final Render web service URL hosts the complete application.

## Google OAuth

In Google Cloud Console, add this redirect URI:

```text
https://your-domain.example/api/auth/google/callback
```

Use the generated client ID and secret as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
