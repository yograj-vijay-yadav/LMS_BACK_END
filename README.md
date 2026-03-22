<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
 
</head>
<body>
  <h1>LMS (Learning Management System) – Server</h1>
  <p>
    A comprehensive backend for a Learning Management System built with Node.js, Express.js, and MongoDB.
    This project offers RESTful APIs for user authentication, course management, payment processing,
    file uploads, email notifications, and robust error handling.
  </p>

  <hr>

  <h2>🚀 Features</h2>
  <ul>
    <li>
      <strong>User Management</strong><br>
      Registration, login, profile updates, password resets
    </li>
    <li>
      <strong>Course Management</strong><br>
      Create, read, update, and delete courses; support for multimedia lectures
    </li>
    <li>
      <strong>Authentication & Authorization</strong><br>
      JWT-based authentication; role-based access control (admin, instructor, student)
    </li>
    <li>
      <strong>Payment Integration</strong><br>
      Razorpay gateway for subscriptions and one-time payments
    </li>
    <li>
      <strong>File Upload</strong><br>
      Multer middleware with Cloudinary integration for image and video storage
    </li>
    <li>
      <strong>Email Service</strong><br>
      Nodemailer for sending verification emails, password resets, and notifications
    </li>
    <li>
      <strong>Error Handling</strong><br>
      Centralized error middleware with custom <code>AppError</code> class and async handler
    </li>
    <li>
      <strong>Security</strong><br>
      CORS configuration, cookie parsing, and bcryptjs password hashing
    </li>
  </ul>

  <hr>

  <h2>🛠️ Tech Stack</h2>
  <ul>
    <li>Runtime: Node.js</li>
    <li>Framework: Express.js</li>
    <li>Database: MongoDB with Mongoose ODM</li>
    <li>Authentication: JSON Web Tokens (JWT)</li>
    <li>File Storage: Cloudinary</li>
    <li>Payment Gateway: Razorpay</li>
    <li>Email Service: Nodemailer</li>
    <li>Password Hashing: bcryptjs</li>
    <li>Development: Nodemon</li>
  </ul>

  <hr>

  <h2>📋 Prerequisites</h2>
  <p>Before you begin, ensure you have:</p>
  <ul>
    <li>Node.js v14 or higher</li>
    <li>MongoDB v4.4 or higher</li>
    <li>npm or yarn</li>
  </ul>

  <hr>

  <h2>⚙️ Environment Variables</h2>
  <p>Create a <code>.env</code> file in the root directory with the following variables:</p>
  <pre><code>
# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/lms

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRY=24h

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_SECRET=your_razorpay_secret

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USERNAME=your_email_username
SMTP_PASSWORD=your_email_password
FROM_EMAIL=noreply@yourdomain.com
  </code></pre>

  <hr>

  <h2>🚀 Installation & Setup</h2>
  <ol>
    <li>
      <strong>Clone the repository</strong><br>
      <pre><code>git clone &lt;your-repository-url&gt;
cd lms/server
      </code></pre>
    </li>
    <li>
      <strong>Install dependencies</strong><br>
      <pre><code>npm install</code></pre>
    </li>
    <li>
      <strong>Configure environment variables</strong><br>
      <pre><code>cp .env.example .env
# Edit .env with your settings
      </code></pre>
    </li>
    <li>
      <strong>Start MongoDB</strong><br>
      <pre><code># Local MongoDB
mongod

# Or MongoDB service
sudo systemctl start mongod
      </code></pre>
    </li>
    <li>
      <strong>Run the application</strong><br>
      <em>Development mode:</em>
      <pre><code>npm run dev</code></pre>
      <em>Production mode:</em>
      <pre><code>npm start</code></pre>
    </li>
  </ol>

  <hr>



  <h2>📁 Project Structure</h2>
  <pre><code>
server/
├── app.js
├── server.js
├── package.json
├── .env
├── configs/
│   └── dbConn.js
├── controllers/
│   ├── course.controller.js
│   ├── miscellaneous.controller.js
│   ├── payment.controller.js
│   └── user.controller.js
├── middlewares/
│   ├── asyncHandler.middleware.js
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   └── multer.middleware.js
├── models/
│   ├── course.model.js
│   ├── Payment.model.js
│   └── user.model.js
├── routes/
│   ├── course.routes.js
│   ├── miscellaneous.routes.js
│   ├── payment.routes.js
│   └── user.routes.js
├── uploads/
└── utils/
    ├── appError.js
    └── sendEmail.js
  </code></pre>

  <hr>

<img width="3241" height="819" alt="mermaid-diagram (1)" src="https://github.com/user-attachments/assets/8f83d9df-7a15-47c7-b979-0247f1e7641a" />



  <h2>🔌 API Endpoints</h2>

  <h3>User Routes (<code>/api/v1/user</code>)</h3>
  <ul>
    <li>POST /register – Register a new user</li>
    <li>POST /login – Authenticate and log in</li>
    <li>GET /logout – Log out current user</li>
    <li>GET /me – Retrieve current user profile</li>
    <li>POST /reset – Request password reset</li>
    <li>POST /reset/:token – Reset password using token</li>
    <li>POST /change-password – Change password (authenticated)</li>
    <li>PUT /update/:id – Update user profile (authenticated)</li>
  </ul>

  <h3>Course Routes (<code>/api/v1/courses</code>)</h3>
  <ul>
    <li>GET / – List all courses</li>
    <li>POST / – Create a new course (admin only)</li>
    <li>GET /:id – Retrieve course by ID</li>
    <li>PUT /:id – Update course (admin only)</li>
    <li>DELETE /:id – Delete course (admin only)</li>
    <li>POST /:id/lectures – Add lecture to course (admin only)</li>
  </ul>

  <h3>Payment Routes (<code>/api/v1/payments</code>)</h3>
  <ul>
    <li>GET /razorpay-key – Get public Razorpay key</li>
    <li>POST /subscribe – Create a subscription</li>
    <li>POST /verify – Verify a payment</li>
    <li>POST /unsubscribe – Cancel a subscription</li>
    <li>GET / – List all payments (admin only)</li>
  </ul>

  <h3>Miscellaneous Routes (<code>/api/v1</code>)</h3>
  <ul>
    <li>POST /contact – Submit contact form</li>
  </ul>

  <hr>

  <h2>🔧 Development</h2>
  <p><strong>Available Scripts</strong></p>
  <ul>
    <li><code>npm start</code> – Start the production server</li>
    <li><code>npm run dev</code> – Start the server in development mode (with nodemon)</li>
  </ul>

  <h3>Adding New Features</h3>
  <ol>
    <li>Add data models in <code>/models</code></li>
    <li>Implement business logic in <code>/controllers</code></li>
    <li>Define routes in <code>/routes</code></li>
    <li>Apply custom middleware in <code>/middlewares</code></li>
  </ol>

  <hr>

  <h2>🔐 Authentication Flow</h2>
  <ol>
    <li>User registers or logs in with credentials</li>
    <li>Server validates credentials and issues a JWT</li>
    <li>Client stores the token and includes it in request headers</li>
    <li>Authentication middleware validates the token on each request</li>
    <li>Access is granted or denied based on user role</li>
  </ol>

  <hr>

  <h2>📤 File Upload Flow</h2>
  <ol>
    <li>Client uploads file via multipart form data</li>
    <li>Multer middleware processes and stores the file in <code>/uploads</code></li>
    <li>File is uploaded to Cloudinary</li>
    <li>Cloudinary returns a URL, which is saved in the database</li>
    <li>Temporary file in <code>/uploads</code> is deleted</li>
  </ol>

  <hr>

  <h2>🚨 Error Handling</h2>
  <ul>
    <li>Custom <code>AppError</code> class for operational errors</li>
    <li><code>asyncHandler</code> middleware to catch async route errors</li>
    <li>Global error handler formats responses and hides stack traces in production</li>
  </ul>

  <hr>

  <h2>🧪 Testing</h2>
  <ul>
    <li>Postman</li>
    <li>Insomnia</li>
    <li>Thunder Client (VS Code extension)</li>
  </ul>

  <hr>

  <h2>🔍 Troubleshooting</h2>
  <ul>
    <li>
      <strong>MongoDB Connection Error</strong><br>
      Ensure MongoDB is running, verify <code>MONGO_URI</code>, and check database permissions.
    </li>
    <li>
      <strong>Cloudinary Upload Fails</strong><br>
      Confirm credentials, file size limits, and formats.
    </li>
    <li>
      <strong>Payment Integration Issues</strong><br>
      Validate Razorpay keys, webhook setup, and currency settings.
    </li>
    <li>
      <strong>Email Not Sending</strong><br>
      Check SMTP credentials, ports, and spam folders.
    </li>
  </ul>



  <p>Thank you for exploring the LMS backend! If you have questions or suggestions, feel free to open an issue or start a discussion.</p>
  
</body>

</html>
