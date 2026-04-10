FROM node:latest
# Vulnerabilidade: Utilizador root
USER root
CMD ["node"]