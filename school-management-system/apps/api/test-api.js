const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/grades/category',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Status Code:', res.statusCode);
        console.log('Response Body:', data);
    });
});

req.on('error', (e) => {
    console.error('Problem with request:', e.message);
});

req.write(JSON.stringify({
    sectionId: "c1f6d3a1-8b3d-4475-8b8e-3908faacc520", // Diamond
    subjectId: "eeefefe7-5b14-43f0-8353-0cbbe86bae82", // Math 7
    academicYearId: "7ca08c50-7488-4f43-b80c-b11a69506b2c", // SY 2024-2025
    name: "New Category",
    weight: 15
}));
req.end();
