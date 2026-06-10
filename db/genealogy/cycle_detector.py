# -*- coding: utf-8 -*-
"""Hot-subtree cycle detection (A1 tier-1 write path)."""
from __future__ import annotations

from collections import defaultdict
from typing import Iterable
from uuid import UUID


class HotSubtreeCycleDetector:
    """
    In-memory adjacency for a bounded subtree only (default depth 4).
    Rejects edge parent→child if child is already reachable from parent.
    """

    def __init__(self, max_depth: int = 4) -> None:
        self.max_depth = max_depth
        self._children: dict[UUID, set[UUID]] = defaultdict(set)

    def load_edges(self, edges: Iterable[tuple[UUID, UUID]]) -> None:
        self._children.clear()
        for parent, child in edges:
            self._children[parent].add(child)

    def add_edge(self, parent_id: UUID, child_id: UUID) -> None:
        self._children[parent_id].add(child_id)

    def would_create_cycle(self, parent_id: UUID, child_id: UUID) -> bool:
        if parent_id == child_id:
            return True
        return self._is_reachable(from_id=child_id, to_id=parent_id, max_hops=self.max_depth * 2)

    def _is_reachable(self, from_id: UUID, to_id: UUID, max_hops: int) -> bool:
        if from_id == to_id:
            return True
        seen: set[UUID] = {from_id}
        frontier: set[UUID] = {from_id}
        for _ in range(max_hops):
            nxt: set[UUID] = set()
            for node in frontier:
                for child in self._children.get(node, ()):
                    if child == to_id:
                        return True
                    if child not in seen:
                        seen.add(child)
                        nxt.add(child)
            if not nxt:
                return False
            frontier = nxt
        return False


def verify_closure_dag_integrity(rows: Iterable[tuple[UUID, UUID, int]]) -> list[UUID]:
    """Tier-2: nodes that appear as their own strict ancestor (depth > 0)."""
    bad: list[UUID] = []
    for ancestor_id, descendant_id, depth in rows:
        if ancestor_id == descendant_id and depth > 0:
            bad.append(ancestor_id)
    return bad
