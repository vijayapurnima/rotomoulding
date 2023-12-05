FROM nginx
EXPOSE 80
COPY nginx/nginx.rails.conf /etc/nginx/conf.d/
COPY release /home/deploy/front-end/release

