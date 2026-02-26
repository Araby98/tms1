import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/lib/storage";

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    if (getCurrentUser()) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);
  return null;
};

export default Index;
