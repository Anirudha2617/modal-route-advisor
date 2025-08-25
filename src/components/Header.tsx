import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, Zap, Database, BarChart3, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              ModalRoute
            </h1>
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6 text-sm">
            <Link to="/">
              <Button variant={isActive("/") ? "default" : "ghost"} className="h-9 px-3">
                <Database className="mr-2 h-4 w-4" />
                Home
              </Button>
            </Link>
            <Link to="/paper">
              <Button variant={isActive("/paper") ? "default" : "ghost"} className="h-9 px-3">
                Research Paper
              </Button>
            </Link>
            <Link to="/results">
              <Button variant={isActive("/results") ? "default" : "ghost"} className="h-9 px-3">
                <BarChart3 className="mr-2 h-4 w-4" />
                Results & Analysis
              </Button>
            </Link>
            <Link to="/leaderboard">
              <Button variant={isActive("/leaderboard") ? "default" : "ghost"} className="h-9 px-3">
                Benchmarks
              </Button>
            </Link>
          </nav>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <div className="h-2 w-2 rounded-full bg-success"></div>
              <span>API Status: Online</span>
            </div>
          </div>
          
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          
          <Link to="/new">
            <Button className="bg-gradient-primary hover:shadow-primary">
              Try It Yourself
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;