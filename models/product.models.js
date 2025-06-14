import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: false,
    default: null
  },
  images: [
    {
      url: { type: String, required: true },
      public_id: { type: String },
    }
  ],
  category: {
    type: String,
    required: true,
    trim: true
  },
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  reservedStock: {
    type: Number,
    default: 0,
    min: 0
  },
  seller: {
    type: String,
  },
  ratings: {
    type: Number,
    default: 0
  },
  numOfReviews: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  strict: true,
  minimize: false
});

// Remove the problematic toJSON transform that might be interfering
productSchema.set('toJSON', {
  transform: function(doc, ret) {
    // Don't modify the image field at all - let it pass through as-is
    return ret;
  }
});

// Virtual field for available stock
productSchema.virtual('availableStock').get(function() {
  return this.stock - this.reservedStock;
});

// Method to update stock
productSchema.methods.updateStock = function(quantity) {
  this.stock += quantity;
  if (this.stock < 0) {
    this.stock = 0;
  }
  return this.save();
};

// Method to reserve stock (for cart items)
productSchema.methods.reserveStock = function(quantity) {
  if (this.availableStock >= quantity) {
    this.reservedStock += quantity;
    return this.save();
  }
  throw new Error('Insufficient stock available');
};

// Method to release reserved stock
productSchema.methods.releaseStock = function(quantity) {
  this.reservedStock -= quantity;
  if (this.reservedStock < 0) {
    this.reservedStock = 0;
  }
  return this.save();
};

const Product = mongoose.model('Product', productSchema);

export default Product;
