$ curl -X POST http://localhost:3060/api/auth/login -H 'Content-Type: application/json' -d '{"email":"student1727567880@example.com","password":"Password123"}'
{
  "authtoken": "eyJhbGciOiAiSFMyNTYiLCAidHlwIjogIkpXVCJ9.eyJlbWFpbCI6InN0dWRlbnQxNzI3NTY3ODgwQGV4YW1wbGUuY29tIiwibmFtZSI6IlN0dWRlbnQgT25lIiwiaWF0IjoxNzkwNjI5MTQ5LCJleHAiOjE3OTA3MTU1NDl9.R-OzaUTKwFmyJSUIa2jmkEbOQFK8v5ygb-Na2tVojNw",
  "name": "Student One",
  "email": "student1727567880@example.com"
}
