# -*- coding: utf-8 -*-
from uuid import UUID

from db.genealogy.cycle_detector import HotSubtreeCycleDetector, verify_closure_dag_integrity


def test_hot_subtree_detects_direct_cycle():
    d = HotSubtreeCycleDetector()
    a, b = UUID(int=1), UUID(int=2)
    assert d.would_create_cycle(a, a) is True
    assert d.would_create_cycle(a, b) is False
    d.add_edge(a, b)
    assert d.would_create_cycle(b, a) is True


def test_hot_subtree_detects_indirect_cycle():
    d = HotSubtreeCycleDetector()
    ids = [UUID(int=i) for i in range(1, 5)]
    d.add_edge(ids[0], ids[1])
    d.add_edge(ids[1], ids[2])
    d.add_edge(ids[2], ids[3])
    assert d.would_create_cycle(ids[3], ids[0]) is True


def test_closure_integrity_self_ancestor():
    nid = UUID(int=99)
    bad = verify_closure_dag_integrity([(nid, nid, 1)])
    assert bad == [nid]
