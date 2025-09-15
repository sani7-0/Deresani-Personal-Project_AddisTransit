# Admin AI Rerouting Feature

## 🎯 **Feature Overview**

The Admin AI Rerouting system allows administrators to use AI-powered congestion predictions to identify crowded areas and dynamically reroute buses to meet passenger demand in real-time.

## 🚀 **How It Works**

### **1. AI Congestion Prediction**

- **Heatmap Visualization**: Interactive map showing congestion levels across the city
- **Real-time Data**: AI predictions with confidence scores and passenger counts
- **Color-coded Areas**: Red (high), Orange (medium-high), Yellow (medium), Green (low)

### **2. Admin Fleet Management Interface**

- **Location Selection**: Click on congestion areas to select destinations
- **Bus Selection**: Choose from available buses (not at full capacity)
- **Reroute Commands**: Send buses to high-demand locations with priority levels

### **3. Driver Dashboard Integration**

- **Real-time Notifications**: Drivers receive reroute commands instantly
- **Accept/Decline Options**: Drivers can accept or decline reroute requests
- **Status Updates**: Real-time feedback on command acceptance

## 📱 **Access Points**

### **Admin Panel**

- **URL**: `/admin/dashboard`
- **Tab**: "Fleet Management"
- **Features**:
  - AI congestion heatmap
  - Available buses list
  - Reroute command interface

### **Driver Dashboard**

- **URL**: `/driver`
- **Features**:
  - Current bus status
  - Passenger count
  - Reroute command notifications
  - Accept/decline functionality

## 🔧 **Technical Implementation**

### **Frontend Components**

- `CongestionHeatmap.jsx` - Interactive map with heatmap visualization
- `FleetManagement.jsx` - Admin interface for bus rerouting
- `DriverDashboard.jsx` - Driver interface for receiving commands

### **Backend API Endpoints**

- `GET /fleet/congestion` - Fetch AI congestion predictions
- `POST /fleet/reroute` - Send reroute command to driver

### **Database Integration**

- Uses existing `buses` table for bus status
- Real-time bus capacity monitoring
- Route assignment updates

## 🎮 **Usage Flow**

### **For Administrators:**

1. **Access Admin Dashboard** → Navigate to "Fleet Management" tab
2. **View Congestion Heatmap** → See AI predictions for different areas
3. **Select High-Demand Location** → Click on red/orange areas
4. **Choose Available Bus** → Select from buses with available capacity
5. **Send Reroute Command** → Bus receives notification instantly

### **For Drivers:**

1. **Access Driver Dashboard** → View current bus status
2. **Receive Reroute Notification** → Modal popup with destination details
3. **Review Command Details** → See reason, priority, and expected passengers
4. **Accept or Decline** → Make decision based on current situation
5. **Navigate to New Location** → Follow updated route instructions

## 📊 **AI Congestion Data**

### **Mock Data Structure**

```json
{
  "area": "Meskel Square",
  "lng": 38.7756,
  "lat": 9.0192,
  "intensity": 0.9,
  "passengers": 150,
  "prediction_confidence": 0.85,
  "timestamp": "2024-01-15 14:30:00"
}
```

### **Congestion Levels**

- **High (80%+)**: Red - Critical congestion, immediate action needed
- **Medium-High (60-80%)**: Orange - High demand, consider rerouting
- **Medium (40-60%)**: Yellow - Moderate congestion
- **Low (0-40%)**: Green - Normal traffic flow

## 🔄 **Real-time Updates**

### **Admin Panel**

- Auto-refresh every 30 seconds
- Live congestion data updates
- Bus status monitoring

### **Driver Dashboard**

- Instant reroute notifications
- Real-time bus capacity updates
- Command status tracking

## 🛠 **Configuration**

### **Environment Variables**

- `VITE_MAPBOX_ACCESS_TOKEN` - Required for heatmap visualization
- `VITE_API_URL` - Backend API endpoint (default: http://localhost:3001)

### **Database Setup**

- Ensure `buses` table exists with passenger count data
- Run existing schema and sample data scripts

## 🚀 **Getting Started**

1. **Start Backend**: `cd backend/php-api && php -S localhost:3001 -t public`
2. **Start Frontend**: `npm run dev`
3. **Access Admin**: Navigate to `/admin/login` (use existing admin credentials)
4. **Access Driver**: Navigate to `/driver` (simulated driver login)

## 🔮 **Future Enhancements**

- **Real AI Integration**: Connect to actual ML models for congestion prediction
- **GPS Integration**: Real-time bus location tracking
- **Push Notifications**: Mobile app integration for drivers
- **Route Optimization**: AI-powered route calculation
- **Historical Analytics**: Congestion pattern analysis
- **Multi-language Support**: Localization for different regions

## 📝 **Notes**

- Currently uses mock AI data for demonstration
- Driver dashboard simulates receiving commands after 5 seconds
- All reroute commands are simulated (no actual GPS navigation)
- System is designed for easy integration with real AI services
- Responsive design works on desktop and mobile devices

This feature provides a complete foundation for AI-powered fleet management and can be easily extended with real AI services and GPS integration.





