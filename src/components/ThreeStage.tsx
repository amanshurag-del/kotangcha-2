import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { AnimatePresence, motion } from 'motion/react';
import { MemoryEntry } from '../types';
import { MonumentScene } from '../lib/MonumentScene';

interface ThreeStageProps {
  memories: MemoryEntry[];
}

export const ThreeStage: React.FC<ThreeStageProps> = ({ memories }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const monumentRef = useRef<MonumentScene | null>(null);
  const [hoveredMemory, setHoveredMemory] = useState<MemoryEntry | null>(null);
  const hoveredMemoryRef = useRef<MemoryEntry | null>(null);
  const isMouseInPopupRef = useRef(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const hoverAudioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const monument = new MonumentScene(
      canvasRef.current,
      containerRef.current.clientWidth,
      containerRef.current.clientHeight
    );
    monumentRef.current = monument;
    monument.updateOfferings(memories);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let isDragging = false;
    let prevMx = 0;
    let prevMy = 0;
    let theta = 0.6;
    let phi = 0.45;
    let radius = 18;
    let autoRotate = true;

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      prevMx = e.clientX;
      prevMy = e.clientY;
      autoRotate = false;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
    };

    const onMouseUp = () => {
      isDragging = false;
      if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current!.getBoundingClientRect();
      const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const my = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      
      if (isDragging) {
        theta -= (e.clientX - prevMx) * 0.007;
        phi += (e.clientY - prevMy) * 0.005;
        phi = Math.max(0.1, Math.min(1.4, phi));
        prevMx = e.clientX;
        prevMy = e.clientY;
      }

      if (monumentRef.current) {
        raycaster.setFromCamera({ x: mx, y: my } as THREE.Vector2, monumentRef.current.camera);
        
        // Check for intersection with offerings OR the structure itself
        const offeringIntersects = raycaster.intersectObjects(monumentRef.current.offeringMeshes);
        const structureIntersects = raycaster.intersectObjects(monumentRef.current.structureMeshes);
        
        const isHoveringMonument = offeringIntersects.length > 0 || structureIntersects.length > 0;

        if (isHoveringMonument) {
          autoRotate = false;
          
          if (offeringIntersects.length > 0) {
            const hit = offeringIntersects[0].object as THREE.Mesh;
            const memory = monumentRef.current.meshToMemory.get(hit);
            if (memory) {
              if (hoveredMemoryRef.current !== memory) {
                hoveredMemoryRef.current = memory;
                setHoveredMemory(memory);
              }
              
              // Project 3D position to screen space for "fixed to structure" behavior
              const vector = hit.position.clone();
              vector.project(monumentRef.current.camera);
              setMousePos({
                x: (vector.x * 0.5 + 0.5) * rect.width + rect.left,
                y: (-(vector.y * 0.5) + 0.5) * rect.height + rect.top
              });

              if (!isDragging) canvasRef.current!.style.cursor = 'pointer';
            }
          } else {
            // Hovering structure but not an offering memory
            if (hoveredMemoryRef.current && !isMouseInPopupRef.current) {
              hoveredMemoryRef.current = null;
              setHoveredMemory(null);
            }
            if (!isDragging) canvasRef.current!.style.cursor = 'default';
          }
        } else {
          if (hoveredMemoryRef.current && !isMouseInPopupRef.current) {
            hoveredMemoryRef.current = null;
            setHoveredMemory(null);
          }
          if (!isDragging) {
            autoRotate = true; // Keep rotating when cursor is off the structure
            canvasRef.current!.style.cursor = 'grab';
          }
        }
      }
    };

    const onMouseLeave = () => {
      if (!isDragging) {
        autoRotate = true;
        if (!isMouseInPopupRef.current) {
          hoveredMemoryRef.current = null;
          setHoveredMemory(null);
        }
      }
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      radius = Math.max(8, Math.min(30, radius + e.deltaY * 0.02));
      autoRotate = false;
    };

    let initialPinchDistance = 0;
    let initialRadius = 0;

    const onTouchStart = (e: TouchEvent) => {
      autoRotate = false;
      if (e.touches.length === 1) {
        // e.preventDefault(); // Handled by passive: false listener but explicit call is safer
        isDragging = true;
        prevMx = e.touches[0].clientX;
        prevMy = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        isDragging = false; // Stop rotation during pinch
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.sqrt(dx * dx + dy * dy);
        initialRadius = radius;
      }
    };

    const getDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!containerRef.current) return;
      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();
      
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        
        if (isDragging) {
          theta -= (touch.clientX - prevMx) * 0.007;
          phi += (touch.clientY - prevMy) * 0.005;
          phi = Math.max(0.1, Math.min(1.4, phi));
        }
        
        prevMx = touch.clientX;
        prevMy = touch.clientY;

        // Raycasting for touch
        if (monumentRef.current) {
          const mx = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
          const my = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
          raycaster.setFromCamera({ x: mx, y: my } as THREE.Vector2, monumentRef.current.camera);
          const offeringIntersects = raycaster.intersectObjects(monumentRef.current.offeringMeshes);
          if (offeringIntersects.length > 0) {
            const hit = offeringIntersects[0].object as THREE.Mesh;
            const memory = monumentRef.current.meshToMemory.get(hit);
            if (memory) {
              hoveredMemoryRef.current = memory;
              setHoveredMemory(memory);
              const vector = hit.position.clone();
              vector.project(monumentRef.current.camera);
              setMousePos({
                x: (vector.x * 0.5 + 0.5) * rect.width + rect.left,
                y: (-(vector.y * 0.5) + 0.5) * rect.height + rect.top
              });
            }
          } else {
            // Only clear if we're not actively dragging
            if (!isDragging) {
              hoveredMemoryRef.current = null;
              setHoveredMemory(null);
            }
          }
        }
      } else if (e.touches.length === 2) {
        const currentDistance = getDistance(e.touches);
        const diff = currentDistance - initialPinchDistance;
        // Sensitivity for pinch zoom
        radius = Math.max(8, Math.min(30, initialRadius - diff * 0.05));
      }
    };

    const onTouchEnd = () => {
      isDragging = false;
    };

    canvasRef.current.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    canvasRef.current.addEventListener('mousemove', onMouseMove);
    canvasRef.current.addEventListener('mouseleave', onMouseLeave);
    canvasRef.current.addEventListener('wheel', onWheel, { passive: false });
    
    canvasRef.current.addEventListener('touchstart', onTouchStart, { passive: false });
    canvasRef.current.addEventListener('touchmove', onTouchMove, { passive: false });
    canvasRef.current.addEventListener('touchend', onTouchEnd);

    const animate = () => {
      if (!monumentRef.current) return;
      if (autoRotate) theta += 0.004;
      monumentRef.current.update(theta, phi, radius, autoRotate);
      requestAnimationFrame(animate);
    };
    const animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!containerRef.current || !monumentRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      monumentRef.current.camera.aspect = w / h;
      monumentRef.current.camera.updateProjectionMatrix();
      monumentRef.current.renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('resize', handleResize);
      if (canvasRef.current) {
        canvasRef.current.removeEventListener('mouseleave', onMouseLeave);
        canvasRef.current.removeEventListener('touchstart', onTouchStart);
        canvasRef.current.removeEventListener('touchmove', onTouchMove);
        canvasRef.current.removeEventListener('touchend', onTouchEnd);
      }
      if (monumentRef.current) monumentRef.current.renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (monumentRef.current) {
      monumentRef.current.updateOfferings(memories);
    }
  }, [memories]);

  useEffect(() => {
    if (hoveredMemory?.audio) {
      if (hoverAudioRef.current) hoverAudioRef.current.pause();
      const audio = new Audio(hoveredMemory.audio);
      audio.loop = true; audio.volume = 0;
      hoverAudioRef.current = audio;
      audio.play().catch(() => {});
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = setInterval(() => {
        if (audio.volume < 0.35) audio.volume = Math.min(0.35, audio.volume + 0.03);
        else if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      }, 60);
      return () => {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = setInterval(() => {
          if (audio.volume > 0) audio.volume = Math.max(0, audio.volume - 0.05);
          else { audio.pause(); if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current); }
        }, 60);
      };
    } else if (hoverAudioRef.current) {
      const audio = hoverAudioRef.current;
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = setInterval(() => {
        if (audio.volume > 0) audio.volume = Math.max(0, audio.volume - 0.05);
        else { audio.pause(); if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current); }
      }, 60);
    }
  }, [hoveredMemory]);

  return (
    <div ref={containerRef} className="fixed inset-0 z-0">
      <canvas ref={canvasRef} className="block w-full h-full" />
      <AnimatePresence>
        {hoveredMemory && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onMouseEnter={() => { isMouseInPopupRef.current = true; }}
            onMouseLeave={() => { isMouseInPopupRef.current = false; }}
            style={{ 
              position: 'fixed', 
              left: mousePos.x, 
              top: mousePos.y - (hoveredMemory.image ? 320 : 120), // Adjust offset based on content height
              transform: 'translateX(-50%)',
              pointerEvents: 'auto', 
              zIndex: 100 
            }}
            className="bg-[#faf9f7] border border-black/5 rounded-sm p-4 w-64 shadow-[0_15px_40px_rgba(0,0,0,0.12)] backdrop-blur-md"
          >
            {hoveredMemory.image ? (
              <div className="flex flex-col gap-3">
                <div className="aspect-square w-full overflow-hidden rounded-[1px] bg-black/5">
                  <img 
                    src={hoveredMemory.image} 
                    alt={hoveredMemory.object} 
                    className="w-full h-full object-cover opacity-90 transition-opacity" 
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <div className="font-sans text-[11px] font-bold tracking-tight text-[#1a1917] flex justify-between items-baseline">
                    <span>{hoveredMemory.name}</span>
                    <span className="text-[#b0ada8] font-normal text-[10px]">{hoveredMemory.place}</span>
                  </div>
                  <div className="text-[#6b6760] font-sans text-[10px] mt-0.5 line-clamp-1">{hoveredMemory.object}</div>
                </div>
              </div>
            ) : (
              <>
                <div className="font-sans text-[12px] font-bold mb-1 tracking-tight text-[#1a1917]">{hoveredMemory.name} · {hoveredMemory.place || 'Somewhere'}</div>
                <div className="text-[#6b6760] font-sans text-[11px] mb-2 leading-snug">{hoveredMemory.object}</div>
                <div className="text-[#b0ada8] font-sans text-[10.5px] italic leading-relaxed border-t border-black/5 pt-2">
                  {hoveredMemory.memory.length > 100 ? hoveredMemory.memory.slice(0, 100) + '…' : hoveredMemory.memory}
                </div>
              </>
            )}
            {hoveredMemory.audio && (
              <div className="mt-2 text-[9px] text-[#a36910] uppercase tracking-[0.2em] font-bold border-t border-black/5 pt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#a36910] rounded-full animate-pulse" />
                Sound offering
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
