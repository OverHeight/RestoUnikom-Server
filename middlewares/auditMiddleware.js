import { supabase } from "../config/supabase.js";

export const auditLog = (actionName) => {
  return async (req, res, next) => {
    // We capture the original send/json to intercept the response and log after completion
    const originalSend = res.send;
    
    res.send = async function (data) {
      res.send = originalSend; // Restore original function
      
      const responseData = typeof data === 'string' ? data : JSON.stringify(data);
      
      // Determine if request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const userId = req.headers['x-user-id'] ? parseInt(req.headers['x-user-id']) : null;
          
          await supabase.from("audit_logs").insert({
            user_id: userId,
            action: actionName,
            resource: req.originalUrl,
            payload: JSON.stringify(req.body),
            // Optionally store the response snippet or record IDs
            timestamp: new Date().toISOString()
          });
        } catch (err) {
          console.error("Failed to write audit log:", err);
        }
      }

      return res.send(data);
    };

    next();
  };
};
