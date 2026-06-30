export default {
  async scheduled(controller, env, ctx) {
    try {
      // 1. Call your API to get the number
      const apiResponse = await fetch("https://water.usace.army.mil/cda/reporting/providers/swt/locations/huds");
      if (!apiResponse.ok) {
        throw new Error(`API error: ${apiResponse.statusText}`);
      }
      
      const data = await apiResponse.json();
      const generatedNumber = data[0].timeseries[4].latest_value; 
      const THRESHOLD = 50;

      // 2. Check if the number is above your threshold
      if (generatedNumber > THRESHOLD) {
        console.log(`Value ${generatedNumber} is above threshold.`);
        
        // 3. Send email
        try {
        fetch('https://resend.com', {
          method: 'POST',
          headers: {
            'Authorization': 'env.RESEND_API_KEY',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Alerts <onboarding@resend.dev>',
            to: 'env.EMAIL', // Your number + carrier domain
            subject: 'Test!',          // Keep subject short or empty
            text: 'Criteria met! The value dropped.' // Keep text under 160 characters
          })
        });
      
         return new Response("Notification dispatched successfully!", { status: 200 });
      
        } catch (error) {
          console.log(`Email Error: ${error.message}`, { status: 500 });
        }
      } else {
        console.log(`Value ${generatedNumber} is below threshold. No email sent.`);
      }

    } catch (error) {
      console.error("Error running daily job:", error);
    }
  }
};
