import React, { useEffect, useRef, useState } from 'react';
import { IconZoomIn, IconZoomOut, IconFitScreen } from './Icons';

// @ts-ignore
const BpmnJS = window.BpmnJS;

interface BpmnViewerProps {
  xml: string;
  highlights?: string[];
  highlightColor?: string;
  hoverHighlightId?: string | null;
  selectedId?: string | null;
  zoomRequest?: { id: string | null; key: number };
}

export const BpmnViewer: React.FC<BpmnViewerProps> = ({ xml, highlights = [], highlightColor = '#dcfce7', hoverHighlightId, selectedId, zoomRequest }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const xmlRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;

    const viewer = new BpmnJS({
      container: containerRef.current,
      keyboard: {
        bindTo: window
      },
      additionalModules: [
        {
          dragging: ['value', { init: () => {}, move: () => {}, hover: () => {}, out: () => {}, end: () => {}, cancel: () => {} }],
          contextPadProvider: ['value', { getContextPadEntries: () => ({}) }],
          paletteProvider: ['value', { getPaletteEntries: () => ({}) }],
        }
      ]
    });
    viewerRef.current = viewer;

    const handTool = viewer.get('handTool');
    handTool.activateHand();

    return () => {
      viewer.destroy();
    };
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const manageDiagram = async () => {
      try {
        if (xml && xmlRef.current !== xml) {
          setIsReady(false);
          await viewer.importXML(xml);
          xmlRef.current = xml;
          viewer.get('canvas').zoom('fit-viewport', 'auto');
          setIsReady(true);
        }

        const canvas = viewer.get('canvas');
        const elementRegistry = viewer.get('elementRegistry');

        elementRegistry.forEach((element: any) => {
          canvas.removeMarker(element.id, 'highlight');
          canvas.removeMarker(element.id, 'hover-highlight');
          canvas.removeMarker(element.id, 'selection-highlight');
        });

        if (highlights.length > 0) {
          highlights.forEach(id => {
            try {
              canvas.addMarker(id, 'highlight');
            } catch (e) {
              // It's okay if element does not exist in this viewer
            }
          });
        }
        
        if (hoverHighlightId) {
          try {
            canvas.addMarker(hoverHighlightId, 'hover-highlight');
          } catch (e) {
             // It's okay if element does not exist in this viewer
          }
        }

        if (selectedId) {
            try {
              canvas.addMarker(selectedId, 'selection-highlight');
            } catch (e) {
               // It's okay if element does not exist in this viewer
            }
          }

      } catch (err) {
        console.error('Error in BPMN viewer:', err);
        setIsReady(false);
      }
    };

    manageDiagram();

  }, [xml, highlights, hoverHighlightId, selectedId]);

  useEffect(() => {
    const zoomToId = zoomRequest?.id;
    const viewer = viewerRef.current;
    
    if (!viewer || !isReady || !zoomToId) {
        return;
    }

    try {
      const canvas = viewer.get('canvas');
      const elementRegistry = viewer.get('elementRegistry');
      const element = elementRegistry.get(zoomToId);

      if (!element) {
        return; // Element not in this diagram, which is fine.
      }
      
      let bbox;

      // Manually calculate bounding box based on element type. This is the "previous version" style logic.
      if (element.waypoints && Array.isArray(element.waypoints) && element.waypoints.length > 0) { 
        // Logic for connections (SequenceFlow, Association) by finding the bounding box of their waypoints.
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        element.waypoints.forEach((point: {x: number, y: number}) => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
        bbox = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
      } else if (typeof element.x === 'number' && typeof element.y === 'number' && typeof element.width === 'number' && typeof element.height === 'number') { 
        // Logic for shapes (Task, Gateway, Event, TextAnnotation) using their direct properties.
        bbox = {
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height
        };
      } else {
          console.warn(`Could not determine bounding box for element ${zoomToId} via manual calculation.`);
          return; // Don't zoom if we can't find a bbox
      }
      
      // Ensure elements with no size (like straight lines) have a minimum bounding box
      // for a pleasant zoom experience.
      if (bbox.width === 0 || bbox.height === 0) {
        bbox = {
          ...bbox,
          width: bbox.width || 50,
          height: bbox.height || 50,
          x: bbox.x - (bbox.width ? 0 : 25),
          y: bbox.y - (bbox.height ? 0 : 25)
        };
      }

      // Get viewport dimensions from the canvas itself for reliability
      const viewbox = canvas.viewbox();
      const viewport = viewbox.outer; 
      if (!viewport || viewport.width === 0 || viewport.height === 0) {
          return; // Container not visible or not initialized
      }


      // Define padding and max zoom
      const PADDING_PX = 80;
      const MAX_ZOOM = 2.5;
      
      // Calculate scale to fit element + padding in viewport
      const paddedViewportWidth = Math.max(1, viewport.width - PADDING_PX * 2);
      const paddedViewportHeight = Math.max(1, viewport.height - PADDING_PX * 2);

      const scaleX = paddedViewportWidth / bbox.width;
      const scaleY = paddedViewportHeight / bbox.height;
      
      let newScale = Math.min(scaleX, scaleY);
      
      // Apply max zoom to prevent extreme zoom-in on small elements
      newScale = Math.min(newScale, MAX_ZOOM);

      // Calculate the new viewbox centered on the element
      const newViewbox = {
        x: bbox.x + bbox.width / 2 - viewport.width / 2 / newScale,
        y: bbox.y + bbox.height / 2 - viewport.height / 2 / newScale,
        width: viewport.width / newScale,
        height: viewport.height / newScale
      };
      
      // Apply the new viewbox to pan and zoom
      canvas.viewbox(newViewbox);
      
    } catch (e) {
      console.error(`Failed to zoom to element ${zoomToId}`, e);
    }
  }, [zoomRequest, isReady]);


  const handleZoom = (direction: 'in' | 'out' | 'reset') => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    const canvas = viewer.get('canvas');
    if (direction === 'reset') {
      canvas.zoom('fit-viewport', 'auto');
    } else {
      const zoomLevel = canvas.zoom();
      const newZoom = direction === 'in' ? zoomLevel * 1.2 : zoomLevel / 1.2;
      canvas.zoom(newZoom);
    }
  };

  return (
    <div className="w-full h-[600px] border rounded-lg bg-gray-50 relative group">
        <style>{`
            .bpmn-viewer-container .djs-container {
                cursor: grab;
            }
            .bpmn-viewer-container .djs-container.djs-grabbing {
                cursor: grabbing;
            }
            .highlight:not(.djs-connection) .djs-visual > :nth-child(1) {
                fill: ${highlightColor} !important;
            }
            .highlight.djs-connection .djs-visual > :nth-child(1) {
                stroke: ${highlightColor === '#FEE2E2' ? '#ef4444' : (highlightColor === '#D1FAE5' ? '#10b981' : '#f59e0b')} !important;
                stroke-width: 5px !important;
            }
            .hover-highlight:not(.djs-connection) .djs-visual > :nth-child(1) {
                stroke: #3b82f6 !important; /* blue-500 */
                stroke-width: 4px !important;
                stroke-dasharray: 5, 2;
                animation: dash-animation 1s linear infinite;
            }
            .hover-highlight.djs-connection .djs-visual > :nth-child(1) {
                stroke: #3b82f6 !important;
                stroke-width: 6px !important;
                stroke-dasharray: 5, 2;
                animation: dash-animation 1s linear infinite;
            }
            @keyframes dash-animation {
                to {
                    stroke-dashoffset: -14;
                }
            }
            .selection-highlight:not(.djs-connection) .djs-visual > :nth-child(1) {
                stroke: #6366f1 !important; /* indigo-500 */
                stroke-width: 5px !important;
            }
            .selection-highlight.djs-connection .djs-visual > :nth-child(1) {
                stroke: #6366f1 !important; /* indigo-500 */
                stroke-width: 7px !important;
            }
        `}</style>
      <div ref={containerRef} className="w-full h-full bpmn-viewer-container"></div>
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-md shadow-lg flex flex-col p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <button onClick={() => handleZoom('in')} className="p-1.5 text-gray-700 hover:bg-gray-100 rounded" aria-label="Zoom in">
          <IconZoomIn className="w-5 h-5" />
        </button>
        <button onClick={() => handleZoom('out')} className="p-1.5 text-gray-700 hover:bg-gray-100 rounded" aria-label="Zoom out">
          <IconZoomOut className="w-5 h-5" />
        </button>
        <button onClick={() => handleZoom('reset')} className="p-1.5 text-gray-700 hover:bg-gray-100 rounded mt-1" aria-label="Reset zoom">
          <IconFitScreen className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};