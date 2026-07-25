import { useLayoutEffect, useRef, useState } from 'react'
import type { TimelineGraphEdge, TimelineModel } from '../../data/timelineModel'
import type { BaseRecord } from '../../data/workbase'

type TimelineGraphModeProps = {
  model: TimelineModel
  selectedCommunityId: string
  onOpenRecord: (record: BaseRecord) => void
  onSelectCommunity: (communityId: string) => void
}

type RenderedEdge = TimelineGraphEdge & {
  x1: number
  y1: number
  x2: number
  y2: number
}

export function TimelineGraphMode({
  model,
  selectedCommunityId,
  onOpenRecord,
  onSelectCommunity,
}: TimelineGraphModeProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null)
  const nodeRefs = useRef(new Map<string, HTMLButtonElement>())
  const [renderedEdges, setRenderedEdges] = useState<RenderedEdge[]>([])

  useLayoutEffect(() => {
    function measureEdges() {
      const canvas = canvasRef.current

      if (!canvas) {
        return
      }

      const canvasRect = canvas.getBoundingClientRect()
      const nextEdges = model.graph.edges.flatMap((edge) => {
        const fromNode = nodeRefs.current.get(edge.fromId)
        const toNode = nodeRefs.current.get(edge.toId)

        if (!fromNode || !toNode) {
          return []
        }

        const fromRect = fromNode.getBoundingClientRect()
        const toRect = toNode.getBoundingClientRect()

        return [{
          ...edge,
          x1: fromRect.left + fromRect.width / 2 - canvasRect.left,
          y1: fromRect.top + fromRect.height / 2 - canvasRect.top,
          x2: toRect.left + toRect.width / 2 - canvasRect.left,
          y2: toRect.top + toRect.height / 2 - canvasRect.top,
        }]
      })

      setRenderedEdges(nextEdges)
    }

    measureEdges()

    const observer = new ResizeObserver(measureEdges)

    if (canvasRef.current) {
      observer.observe(canvasRef.current)
    }

    window.addEventListener('resize', measureEdges)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measureEdges)
    }
  }, [model.graph.edges, selectedCommunityId])

  const communityNodes = model.gantt.rows

  return (
    <section className="risk-graph-shell" data-testid="timeline-graph" aria-label="Timeline risk graph">
      <div className="graph-focus-strip" aria-label="Graph place focus">
        <span>Place focus</span>
        <div>
          {communityNodes.map((row) => (
            <button
              className={row.communityId === (model.graph.center?.id || selectedCommunityId) ? 'selected' : ''}
              key={row.communityId}
              type="button"
              onClick={() => onSelectCommunity(row.communityId)}
            >
              {row.community}
            </button>
          ))}
        </div>
      </div>
      {model.graph.center ? (
        <div className="risk-graph-layout">
          <div className="risk-graph-canvas" ref={canvasRef}>
            <svg aria-hidden="true" className="risk-graph-lines">
              {renderedEdges.map((edge) => (
                <line
                  data-edge-id={edge.id}
                  data-from-id={edge.fromId}
                  data-to-id={edge.toId}
                  key={edge.id}
                  x1={edge.x1}
                  x2={edge.x2}
                  y1={edge.y1}
                  y2={edge.y2}
                />
              ))}
            </svg>
            {model.graph.nodes.map((node, index) => (
              <button
                className={`graph-node graph-node-${node.role} graph-position-${index} tone-${node.card.tone}`}
                data-graph-node-id={node.id}
                key={node.id}
                ref={(element) => {
                  if (element) {
                    nodeRefs.current.set(node.id, element)
                  } else {
                    nodeRefs.current.delete(node.id)
                  }
                }}
                type="button"
                onClick={() => onOpenRecord(node.card.record)}
              >
                <span>{node.role === 'center' ? 'Place' : node.card.place}</span>
                <strong>{node.card.title}</strong>
                <small>{node.card.status}</small>
              </button>
            ))}
            {model.graph.nextMove && (
              <button className="risk-next-move" type="button" onClick={() => onOpenRecord(model.graph.nextMove!.record)}>
                <span>Next move</span>
                <strong>{model.graph.nextMove.title}</strong>
                <small>{model.graph.nextMove.nextMove}</small>
              </button>
            )}
          </div>
          <aside className="risk-why-panel" aria-label="Why at risk">
            <span>Why at risk</span>
            {model.graph.whyAtRisk.map((reason) => (
              <article key={reason}>
                <strong>{reason}</strong>
              </article>
            ))}
          </aside>
        </div>
      ) : (
        <p className="empty-note">No place work is available.</p>
      )}
    </section>
  )
}
