import dbConnect from "./database/config";

// import logger from "./middleware/logger.middleware";

const bootstrap = async (app:any) => {
  try {
    const port = process.env.PORT;
    const ip = process.env.IP;
    // Connect Database
       dbConnect();
    // Start Web Server
    await import("./listeners/product.listener");
    await import("./listeners/variantAttribute.listener");
    
    app.listen(port,ip, () => {
      console.log(`Web Server Running on http://${ip}:${port}`);
    });
  } catch (error) {
    console.log(error);
    
    // logger.log('error', error);
  }
};

export default bootstrap;
