# Unit Tests — Specifications

Key unit test cases per module. Framework: **pytest** (FastAPI), **Vitest** (Next.js).

---

## FastAPI — AI Client

### Test: NIM request formatting

```python
def test_nim_request_headers():
    client = NIMClient(api_key="test-key")
    headers = client._build_headers()
    assert headers["Authorization"] == "Bearer test-key"
    assert headers["Content-Type"] == "application/json"
```

### Test: 429 retry with backoff

```python
@pytest.mark.asyncio
async def test_nim_retries_on_429(httpx_mock):
    httpx_mock.add_response(status_code=429)
    httpx_mock.add_response(status_code=429)
    httpx_mock.add_response(status_code=200, json={"choices": [{"message": {"content": "ok"}}]})

    client = NIMClient(api_key="test-key")
    result = await client.complete("test prompt", model="test-model")

    assert result == "ok"
    assert len(httpx_mock.get_requests()) == 3
```

### Test: Fallback to Ollama on NIM failure

```python
@pytest.mark.asyncio
async def test_falls_back_to_ollama_after_max_retries(httpx_mock):
    # NIM returns 429 3 times
    for _ in range(3):
        httpx_mock.add_response(url="https://integrate.api.nvidia.com", status_code=429)
    # Ollama returns success
    httpx_mock.add_response(url="http://localhost:11434", status_code=200,
                            json={"response": "fallback result"})

    client = AIClient(user_plan="free")
    result = await client.complete_with_fallback("test prompt", agent="analyst")
    assert result == "fallback result"
```

---

## FastAPI — Blackboard

### Test: Field is cleared after consumption

```python
def test_raw_code_cleared_after_debugger_reads():
    bb = create_blackboard(job_id="test", business_data={})
    bb["raw_code"] = "<html>...</html>"

    # Simulate debugger consuming raw_code
    _ = bb["raw_code"]
    bb["raw_code"] = None

    assert bb["raw_code"] is None
    assert bb["debugged_code"] is not None  # debugger set this
```

### Test: Parallel agents both write to blackboard

```python
@pytest.mark.asyncio
async def test_agents_2_and_3_run_in_parallel():
    bb = create_test_blackboard()
    start = time.time()
    await asyncio.gather(run_agent_2(bb), run_agent_3(bb))
    elapsed = time.time() - start

    assert bb["content_output"] is not None
    assert bb["style_output"] is not None
    # Both ran in parallel — elapsed should be less than sum of sequential
    assert elapsed < 30  # sequential would be ~40s with under-10B local models
```

---

## FastAPI — Pipeline Queue

### Test: Duplicate job rejected

```python
def test_duplicate_job_rejected():
    queue = JobQueue()
    queue.enqueue(job_id="job-1", project_id="proj-a")

    with pytest.raises(DuplicateJobError):
        queue.enqueue(job_id="job-2", project_id="proj-a")
```

### Test: Queue processes in FIFO order

```python
def test_queue_fifo_order():
    queue = JobQueue()
    queue.enqueue(job_id="a", project_id="p1")
    queue.enqueue(job_id="b", project_id="p2")
    queue.enqueue(job_id="c", project_id="p3")

    assert queue.next().job_id == "a"
    assert queue.next().job_id == "b"
    assert queue.next().job_id == "c"
```

---

## FastAPI — Agent Output Parser

### Test: FILE_MARKER extraction

```python
def test_extracts_html_from_markers():
    raw_output = "{FILE_MARKER_START}\n<!DOCTYPE html><html></html>\n{FILE_MARKER_END}"
    html = extract_html(raw_output)
    assert html == "<!DOCTYPE html><html></html>"

def test_raises_on_missing_markers():
    with pytest.raises(ParseError):
        extract_html("no markers in this response")

def test_handles_leading_whitespace():
    raw_output = "  {FILE_MARKER_START}\n<html/>\n{FILE_MARKER_END}  "
    html = extract_html(raw_output)
    assert html == "<html/>"
```

---

## Next.js — API Routes

### Test: `/api/generate` rejects over-limit user

```typescript
// vitest
it('returns 402 when revision limit reached', async () => {
  mockSupabase.returns({ plan: 'free', revisions_used: 3, revisions_limit: 3 })

  const res = await POST('/api/generate', { project_id: 'uuid', business_data: {} })
  expect(res.status).toBe(402)
  expect(await res.json()).toMatchObject({ error: 'revision_limit_reached' })
})
```

### Test: `/api/billing/webhook` verifies Stripe signature

```typescript
it('rejects request with invalid Stripe signature', async () => {
  const res = await POST('/api/billing/webhook', {}, {
    headers: { 'stripe-signature': 'invalid' }
  })
  expect(res.status).toBe(400)
})
```

---

## Next.js — Places Search

### Test: Debounce prevents immediate API call

```typescript
it('does not search immediately on input', async () => {
  const searchFn = vi.fn()
  render(<PlacesSearch onSearch={searchFn} />)

  userEvent.type(screen.getByRole('textbox'), 'Mike')
  expect(searchFn).not.toHaveBeenCalled()

  await vi.advanceTimersByTimeAsync(300)
  expect(searchFn).toHaveBeenCalledOnce()
})
```

---

## Revision Counter

### Test: Decrement trigger fires on revision insert

```sql
-- Supabase SQL — run in test environment
INSERT INTO public.revisions (project_id, user_id, instruction)
VALUES ('test-project-id', 'test-user-id', 'Change the phone number');

SELECT revisions_used FROM public.users WHERE id = 'test-user-id';
-- Expected: previous value + 1
```
