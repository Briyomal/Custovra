import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import FloatingBackground from "../components/FloatingBackground";

function NotFoundPage() {

  return (
    <FloatingBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
            className="relative inline-block"
          >
            <div className="text-[8rem] md:text-[10rem] font-bold text-primary/10 dark:text-primary/20">404</div>
            <motion.div
              className="absolute -top-4 -right-4"
              animate={{
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse",
                delay: 0.5
              }}
            >
              <Search className="w-8 h-8 text-lime-500" />
            </motion.div>
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-bold text-foreground mb-4"
          >
            Page Not Found
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground mb-8"
          >
            Oops! The page you are looking for doesn&apos;t exist or has been moved.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button 
              asChild
              className="bg-gradient-to-r from-[#16bf4c] to-lime-500 hover:from-lime-400 hover:to-[#1cbf16] text-white"
            >
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            
            <Button 
              variant="outline"
              asChild
              className="border-lime-500 text-foreground hover:bg-lime-500 hover:text-white dark:hover:bg-lime-500 dark:hover:text-white"
            >
              <Link to="/dashboard">
                Go to Dashboard
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </FloatingBackground>
  );
}

export default NotFoundPage;