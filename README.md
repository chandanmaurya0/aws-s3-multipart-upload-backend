## AWS S3 file upload using presigned URL and Multipart upload

In this NodeJs service , we have endpoints to upload files using single presigned url and large file using multi-part.

1. **/generate-single-presigned-url** :- Single AWS S3 presigned url to upload file
2. **/start-multipart-upload** : - it provides the uploadId to start multi-part upload
3. **/generate-presigned-url** :- it generates presigned URLs based on number of chunks
4. **/complete-multipart-upload** : - it is called after uploading all the files chunks to presigned URLs. 

### Steps to run the Server

Install all the library

``` npm install ```

Start the server

``` npm run start```

Server will be running on default port 8080
