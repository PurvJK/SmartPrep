import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'faculty'],
    default: 'student'
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  profile: {
    phone: {
      type: String,
      default: ''
    },
    college: {
      type: String,
      default: ''
    },
    branch: {
      type: String,
      default: ''
    },
    year: {
      type: String,
      default: ''
    },
    studentId: {
      type: String,
      default: ''
    },
    department: {
      type: String,
      default: ''
    },
    class: {
      type: String,
      default: ''
    },
    division: {
      type: String,
      default: ''
    },
    domain: [{
      type: String
    }],
    resume: {
      type: String,
      default: ''
    }
  },
  progress: {
    totalQuizzes: {
      type: Number,
      default: 0
    },
    completedQuizzes: {
      type: Number,
      default: 0
    },
    totalCodingProblems: {
      type: Number,
      default: 0
    },
    solvedCodingProblems: {
      type: Number,
      default: 0
    },
    studyMaterialsRead: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }

  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS || (process.env.NODE_ENV === 'development' ? 2 : 10));
  const salt = await bcrypt.genSalt(saltRounds);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Update last login without triggering password rehashing
userSchema.methods.updateLastLogin = function() {
  return this.constructor.findByIdAndUpdate(
    this._id,
    { lastLogin: new Date() },
    { new: true }
  );
};

export default mongoose.model('User', userSchema);
