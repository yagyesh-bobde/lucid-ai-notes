// src/components/canvas/IdeationCanvas.tsx
import React, { useState, useRef, useEffect } from "react";
import { X, Square, Circle, Type, Pencil, Move, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type ElementType = "note" | "rectangle" | "circle" | "text";
type ToolType = ElementType | "pen" | "move" | "eraser";

interface CanvasElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  content?: string;
  color: string;
  zIndex: number;
}

interface DrawPath {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  zIndex: number;
}

const COLORS = [
  "#FFD166", // yellow
  "#EF476F", // pink
  "#26547C", // dark blue
  "#06D6A0", // green
  "#66D7D1", // teal
  "#FCFCFC", // white
];

const DEFAULT_NOTE_SIZE = 150;
const DEFAULT_SHAPE_SIZE = 100;

export function IdeationCanvas() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>("note");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<{ x: number; y: number }[]>([]);
  const [highestZIndex, setHighestZIndex] = useState(1);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);
  const isEditingText = useRef(false);

  // Handle mouse down event for creating or selecting elements
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if clicking on an existing element
    const clickedElement = [...elements].reverse().find(el => {
      if (el.type === "circle") {
        const distance = Math.sqrt(Math.pow(x - el.x, 2) + Math.pow(y - el.y, 2));
        return distance <= (el.radius || DEFAULT_SHAPE_SIZE / 2);
      } else {
        return x >= el.x && 
               x <= el.x + (el.width || DEFAULT_NOTE_SIZE) && 
               y >= el.y && 
               y <= el.y + (el.height || DEFAULT_NOTE_SIZE);
      }
    });
    
    if (clickedElement && selectedTool === "move") {
      // Select element for moving
      setSelectedElement(clickedElement.id);
      return;
    } else if (clickedElement && selectedTool === "eraser") {
      // Delete element
      setElements(elements.filter(el => el.id !== clickedElement.id));
      return;
    } else if (clickedElement && selectedTool === "text" && clickedElement.type === "text") {
      // Edit existing text
      setSelectedElement(clickedElement.id);
      isEditingText.current = true;
      return;
    }
    
    // Creating new elements
    if (selectedTool === "pen") {
      // Start drawing path
      setIsDrawing(true);
      setCurrentPath([{ x, y }]);
      return;
    }
    
    // Create new element based on selected tool
    if (["note", "rectangle", "circle", "text"].includes(selectedTool)) {
      const newZIndex = highestZIndex + 1;
      setHighestZIndex(newZIndex);
      
      const id = `element-${Date.now()}`;
      const newElement: CanvasElement = {
        id,
        type: selectedTool as ElementType,
        x,
        y,
        color: selectedColor,
        zIndex: newZIndex,
        content: selectedTool === "note" || selectedTool === "text" ? "" : undefined,
      };
      
      if (selectedTool === "rectangle" || selectedTool === "note") {
        newElement.width = selectedTool === "note" ? DEFAULT_NOTE_SIZE : DEFAULT_SHAPE_SIZE;
        newElement.height = selectedTool === "note" ? DEFAULT_NOTE_SIZE : DEFAULT_SHAPE_SIZE;
      } else if (selectedTool === "circle") {
        newElement.radius = DEFAULT_SHAPE_SIZE / 2;
      } else if (selectedTool === "text") {
        newElement.width = 150;
        newElement.height = 50;
      }
      
      setElements([...elements, newElement]);
      setSelectedElement(id);
      
      if (selectedTool === "text") {
        isEditingText.current = true;
      }
    }
  };

  // Handle mouse move event for drawing or moving elements
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (isDrawing && selectedTool === "pen") {
      // Continue drawing path
      setCurrentPath([...currentPath, { x, y }]);
      return;
    }
    
    if (selectedElement && selectedTool === "move") {
      // Move selected element
      setElements(
        elements.map(el => 
          el.id === selectedElement 
            ? { ...el, x, y } 
            : el
        )
      );
    }
  };

  // Handle mouse up event to finish drawing or moving
  const handleMouseUp = () => {
    if (isDrawing && currentPath.length > 1) {
      // Finish drawing path
      const newZIndex = highestZIndex + 1;
      setHighestZIndex(newZIndex);
      
      setPaths([
        ...paths,
        {
          id: `path-${Date.now()}`,
          points: currentPath,
          color: selectedColor,
          width: 2,
          zIndex: newZIndex,
        }
      ]);
    }
    
    setIsDrawing(false);
    setCurrentPath([]);
    
    if (selectedTool !== "text") {
      setSelectedElement(null);
    }
  };

  // Handle text content change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>, id: string) => {
    setElements(
      elements.map(el => 
        el.id === id ? { ...el, content: e.target.value } : el
      )
    );
  };

  // Handle text area blur to finish editing
  const handleTextBlur = () => {
    isEditingText.current = false;
    setSelectedElement(null);
  };

  // Focus text input when a text element is created or selected
  useEffect(() => {
    if (isEditingText.current && textInputRef.current && selectedElement) {
      textInputRef.current.focus();
    }
  }, [selectedElement]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete" && selectedElement) {
        setElements(elements.filter(el => el.id !== selectedElement));
        setSelectedElement(null);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [elements, selectedElement]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 border-b bg-background">
        <div className="flex space-x-2">
          <Button
            variant={selectedTool === "note" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("note")}
            title="Add Note"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M7.5 0.875C5.49797 0.875 3.875 2.49797 3.875 4.5C3.875 6.15288 4.98124 7.54738 6.49373 7.98351C5.2997 8.12901 4.27557 8.55134 3.50407 9.31167C2.52216 10.2794 2.02502 11.72 2.02502 13.5999C2.02502 13.8623 2.23769 14.0749 2.50002 14.0749C2.76236 14.0749 2.97502 13.8623 2.97502 13.5999C2.97502 11.8799 3.42786 10.7206 4.17091 9.9883C4.91536 9.25463 6.02674 8.87499 7.49995 8.87499C8.97317 8.87499 10.0846 9.25463 10.8291 9.98831C11.5721 10.7206 12.025 11.8799 12.025 13.5999C12.025 13.8623 12.2376 14.0749 12.5 14.0749C12.7623 14.0749 12.975 13.8623 12.975 13.5999C12.975 11.72 12.4779 10.2794 11.496 9.31166C10.7243 8.55117 9.69998 8.12883 8.50589 7.98343C10.0185 7.54729 11.125 6.15281 11.125 4.5C11.125 2.49797 9.50203 0.875 7.5 0.875ZM4.825 4.5C4.825 3.02264 6.02264 1.825 7.5 1.825C8.97736 1.825 10.175 3.02264 10.175 4.5C10.175 5.97736 8.97736 7.175 7.5 7.175C6.02264 7.175 4.825 5.97736 4.825 4.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
            </svg>
          </Button>
          
          <Button
            variant={selectedTool === "rectangle" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("rectangle")}
            title="Rectangle"
          >
            <Square className="h-4 w-4" />
          </Button>
          
          <Button
            variant={selectedTool === "circle" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("circle")}
            title="Circle"
          >
            <Circle className="h-4 w-4" />
          </Button>
          
          <Button
            variant={selectedTool === "text" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("text")}
            title="Text"
          >
            <Type className="h-4 w-4" />
          </Button>
          
          <Button
            variant={selectedTool === "pen" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("pen")}
            title="Pen"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          
          <Button
            variant={selectedTool === "move" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("move")}
            title="Move"
          >
            <Move className="h-4 w-4" />
          </Button>
          
          <Button
            variant={selectedTool === "eraser" ? "default" : "outline"}
            size="icon"
            onClick={() => setSelectedTool("eraser")}
            title="Eraser"
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="w-8 h-8 p-0">
                <div
                  className="w-5 h-5 rounded-full border border-border"
                  style={{ backgroundColor: selectedColor }}
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <div className="flex flex-wrap gap-1 p-1">
                {COLORS.map(color => (
                  <div
                    key={color}
                    className={cn(
                      "w-6 h-6 rounded-full cursor-pointer hover:scale-110 transition-transform", 
                      selectedColor === color ? "ring-2 ring-primary" : ""
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setSelectedColor(color)}
                  />
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setElements([]);
              setPaths([]);
              setHighestZIndex(1);
            }}
            className="text-xs"
          >
            Clear Canvas
          </Button>
        </div>
      </div>
      
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-hidden bg-secondary/20"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Display existing paths */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {paths.map(path => (
            <polyline
              key={path.id}
              points={path.points.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={path.color}
              strokeWidth={path.width}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ zIndex: path.zIndex }}
            />
          ))}
          
          {/* Display current drawing path */}
          {isDrawing && currentPath.length > 1 && (
            <polyline
              points={currentPath.map(p => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={selectedColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ zIndex: highestZIndex + 1 }}
            />
          )}
        </svg>
        
        {/* Display canvas elements */}
        {elements.map(element => {
          switch (element.type) {
            case "note":
              return (
                <div
                  key={element.id}
                  className="absolute p-2 shadow-md rounded resize-notes"
                  style={{
                    left: element.x + "px",
                    top: element.y + "px",
                    width: element.width + "px",
                    height: element.height + "px",
                    backgroundColor: element.color,
                    zIndex: element.zIndex,
                  }}
                >
                  <textarea
                    className="w-full h-full bg-transparent resize-none border-none focus:outline-none text-foreground"
                    value={element.content || ""}
                    onChange={(e) => handleTextChange(e, element.id)}
                    placeholder="Add your note..."
                    ref={selectedElement === element.id ? textInputRef : null}
                    onBlur={handleTextBlur}
                  />
                </div>
              );
              
            case "rectangle":
              return (
                <div
                  key={element.id}
                  className="absolute rounded-md border-2"
                  style={{
                    left: element.x + "px",
                    top: element.y + "px",
                    width: element.width + "px",
                    height: element.height + "px",
                    backgroundColor: `${element.color}40`,
                    borderColor: element.color,
                    zIndex: element.zIndex,
                  }}
                />
              );
              
            case "circle":
              return (
                <div
                  key={element.id}
                  className="absolute rounded-full border-2"
                  style={{
                    left: (element.x - (element.radius || 0)) + "px",
                    top: (element.y - (element.radius || 0)) + "px",
                    width: (element.radius || 0) * 2 + "px",
                    height: (element.radius || 0) * 2 + "px",
                    backgroundColor: `${element.color}40`,
                    borderColor: element.color,
                    zIndex: element.zIndex,
                  }}
                />
              );
              
            case "text":
              return (
                <div
                  key={element.id}
                  className="absolute"
                  style={{
                    left: element.x + "px",
                    top: element.y + "px",
                    zIndex: element.zIndex,
                  }}
                >
                  <textarea
                    className="bg-transparent resize-none border-none focus:outline-none text-foreground min-w-[150px] min-h-[40px]"
                    value={element.content || ""}
                    onChange={(e) => handleTextChange(e, element.id)}
                    placeholder="Add text..."
                    ref={selectedElement === element.id ? textInputRef : null}
                    onBlur={handleTextBlur}
                  />
                </div>
              );
              
            default:
              return null;
          }
        })}
      </div>
    </div>
  );
}