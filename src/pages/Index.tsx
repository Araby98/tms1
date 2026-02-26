import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "@/lib/storage";

const Index = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate(getCurrentUser() ? "/dashboard" : "/login");
  }, [navigate]);
  return null;
};

export default Index;
