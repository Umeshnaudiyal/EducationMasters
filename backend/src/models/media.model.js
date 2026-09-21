import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema(
  {
    sql_id: { type: Number, index: true },
    name: String,
    alt: String,
    description: String,
    caption: String,
    path: String,
    file: String,
    type: String,
    size: String,
    
    // Mongoose ObjectId References
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    user_id: Number,
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Global Virtual Field: img_url
mediaSchema.virtual('img_url').get(function () {
  if (!this.file) return 'https://educationmasters.in/assets/img/hp/popc/job-search.png';
  if (this.file.startsWith('http://') || this.file.startsWith('https://')) {
    return this.file;
  }
  if (this.file.includes('_17') || this.file.includes('_18') || this.file.includes('_19')) {
    return `http://localhost:5001${this.file.startsWith('/') ? this.file : '/' + this.file}`;
  }
  return `https://educationmasters.in${this.file.startsWith('/') ? this.file : '/' + this.file}`;
});

const Media = mongoose.model('Media', mediaSchema);
export default Media;
