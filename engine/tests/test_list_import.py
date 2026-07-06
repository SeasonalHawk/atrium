import json

from src.sourcing.list_import import ListImportSource

ICP_PROFILE = {"id": "embedded-executive"}


def write_target(targets_dir, target_id, data):
    targets_dir.mkdir(parents=True, exist_ok=True)
    (targets_dir / f"{target_id}.json").write_text(json.dumps(data))


def test_discover_empty_dir_returns_empty(tmp_path):
    source = ListImportSource(targets_dir=tmp_path / "missing")
    assert source.discover(ICP_PROFILE) == []


def test_discover_reads_target_files(tmp_path):
    targets_dir = tmp_path / "targets"
    write_target(
        targets_dir,
        "acme",
        {
            "company": "Acme Corp",
            "sourceDetail": "Conference 2026",
            "companyUrl": "https://acme.example",
            "contactName": "Jane Doe",
            "contactEmail": "jane@acme.example",
        },
    )

    source = ListImportSource(targets_dir=targets_dir)
    candidates = source.discover(ICP_PROFILE)

    assert len(candidates) == 1
    c = candidates[0]
    assert c.company == "Acme Corp"
    assert c.source == "list-import"
    assert c.source_detail == "Conference 2026"
    assert c.company_url == "https://acme.example"
    assert c.contact_name == "Jane Doe"
    assert c.contact_email == "jane@acme.example"
    assert c.icp_profile_id == "embedded-executive"


def test_discover_respects_limit(tmp_path):
    targets_dir = tmp_path / "targets"
    for i in range(5):
        write_target(targets_dir, f"company-{i}", {"company": f"Company {i}"})

    source = ListImportSource(targets_dir=targets_dir)
    candidates = source.discover(ICP_PROFILE, limit=2)

    assert len(candidates) == 2


def test_discover_handles_missing_icp_profile(tmp_path):
    targets_dir = tmp_path / "targets"
    write_target(targets_dir, "acme", {"company": "Acme Corp"})

    source = ListImportSource(targets_dir=targets_dir)
    candidates = source.discover(None)

    assert candidates[0].icp_profile_id is None
