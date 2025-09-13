# Bus Coordinator Ticketing System

## 🎯 **System Overview**

The ticketing system is now a **background feature** for bus coordinators to track passenger counts. It's not visible in the main navigation - coordinators access it via a direct URL.

## 🚌 **How It Works**

### **For Bus Coordinators:**

1. **Access Interface:** Go to `/coordinator` (hidden from main navigation)
2. **Print Ticket:** When a passenger boards, click "Print Ticket (+1)"
3. **System Updates:** Automatically increments passenger count and shows status
4. **Reset Bus:** At end of route, click "Reset Bus" to clear passenger count

### **For Passengers/Users:**

- **Map View:** See bus status with color-coded indicators (🟢🟡🔴)
- **Passenger Count:** View current passengers vs capacity
- **Real-time Updates:** Status updates automatically as coordinators print tickets

## 🎫 **Ticketing Flow**

```
1. Passenger boards bus
2. Coordinator prints ticket → +1 passenger count
3. System updates bus status (green/yellow/red)
4. Passengers see updated capacity on map
5. End of route → Coordinator resets bus → Count = 0
```

## 📊 **Status Indicators**

- **🟢 Green:** < 50% capacity (plenty of space)
- **🟡 Yellow:** 50-80% capacity (getting full)
- **🔴 Red:** > 80% capacity (nearly full)

## 🔧 **Technical Implementation**

### **Database (Your Exact Schema):**

- Uses your `plzwork.sql` database structure
- `buses` table with `current_passenger_count` and `max_capacity`
- `ticket_count` table for tracking tickets sold
- PostgreSQL functions: `add_ticket()` and `reset_bus_count()`

### **Backend API:**

- `POST /buses/add-ticket` - Increment passenger count
- `POST /buses/reset` - Reset passenger count
- `GET /buses/status` - Get bus status with passenger data

### **Frontend:**

- **Hidden Route:** `/coordinator` (not in main navigation)
- **Map Integration:** Bus markers show passenger status
- **Real-time Updates:** Auto-refresh every 30 seconds

## 🚀 **Setup Instructions**

### **1. Database Setup:**

```bash
# Use your existing database
psql -d transit -f backend/php-api/schema.postgresql.sql
```

### **2. Backend:**

```bash
cd backend/php-api
php -S localhost:3001 -t public
```

### **3. Frontend:**

```bash
npm run dev
```

### **4. Access Points:**

- **Public:** `http://localhost:3000/map` (see bus status)
- **Coordinators:** `http://localhost:3000/coordinator` (manage tickets)

## 🎯 **Key Features**

✅ **Background System:** Not visible in main navigation
✅ **Real-time Updates:** Passenger counts update instantly
✅ **Color-coded Status:** Green/Yellow/Red indicators
✅ **Capacity Tracking:** Shows passengers vs max capacity
✅ **Bus Reset:** Clear counts at end of route
✅ **Your Database:** Uses your exact `plzwork.sql` structure

## 📱 **Usage Examples**

### **Coordinator Workflow:**

1. Open `/coordinator` interface
2. Select bus plate number (e.g., "AA-1234-5678")
3. Click "Print Ticket (+1)" for each passenger
4. Watch status change from green → yellow → red
5. At end of route, click "Reset Bus"

### **Passenger Experience:**

1. Open map at `/map`
2. See buses with color-coded status
3. View passenger count (e.g., "25/40 passengers")
4. Know if bus is full before boarding

## 🔒 **Security**

- Coordinator interface is hidden from main navigation
- Direct URL access only (`/coordinator`)
- No authentication required (internal use)
- Can be protected with basic auth if needed

The system now works exactly as you wanted - a background ticketing system for coordinators that automatically tracks passenger counts and displays status information to users! 🚌✨
