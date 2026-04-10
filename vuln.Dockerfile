FROM ubuntu:latest
RUN apt-get update && apt-get install -y openssh-server
# Grave: Utilizador root e SSH exposto
USER root
EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]