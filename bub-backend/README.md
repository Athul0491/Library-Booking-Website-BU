## 📌 `/api/availability` Endpoint

### **Method**
`GET`

### **Description**
Fetches room availability slots from BU LibCal for a given library, date, and time range.  
If **start date = end date**, the API automatically queries the next day too (due to LibCal quirks) but filters results back to the requested date & time.

---

### **Request Payload**

```json
{
  "library": "par",       // First 3 letters of library name (mug, par, pic, sci)
  "start": "2025-07-25",  // Start date (YYYY-MM-DD)
  "end": "2025-07-25",    // End date (YYYY-MM-DD)
  "start_time": "13:00",  // (Optional) Filter start time (HH:MM 24-hour)
  "end_time": "16:00"     // (Optional) Filter end time (HH:MM 24-hour)
}
```
### **Response Example**

```json
{
  "bookings": [],
  "isPreCreatedBooking": false,
  "slots": [
    {
      "checksum": "765760965e8740b8700df9932933cb88",
      "end": "2025-07-25 13:30:00",
      "itemId": 168796,
      "start": "2025-07-25 13:00:00"
    },
    {
      "checksum": "af932e69f44341b0a109c979087b82f6",
      "end": "2025-07-25 14:00:00",
      "itemId": 168797,
      "start": "2025-07-25 13:30:00"
    }
  ]
}

```



