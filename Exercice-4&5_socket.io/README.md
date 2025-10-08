apres avoir lancé le docker-compose, deux serveurs node ce sont lancé.

- un sur http://localhost:3000
- un sur http://localhost:3001

le but, tester l'interconnection entre deux serveur grâce à redis en utilisant socket.io .

- ouvrez le port 3000 sur votre navigateur, entrez un username et un nom de salon.
- ouvrez le port 3001 sur un navigateur privé, entrez un autre username et le meme nom de salon.

vous pouvez discuter sur deux serveur différents mais qui sont tout de même synchronisé.