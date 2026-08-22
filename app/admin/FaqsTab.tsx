import { Form } from "react-router";
import type { AdminFaq } from "~/types";

export function FaqsTab({ faqs }: { faqs: AdminFaq[] }) {
  return (
    <>
      <div className="admin-card">
        <div className="admin-head">
          <h2>FAQ</h2>
          <Form method="post">
            <button className="btn btn--xs btn--primary" type="submit" name="intent" value="faq-add">
              + Add question
            </button>
          </Form>
        </div>
        <p className="admin-hint">Shown on the About page. Changes save as you type.</p>
      </div>
      {!faqs.length ? (
        <div className="admin-empty">No questions yet.</div>
      ) : (
        faqs.map((faq) => (
          <div className="admin-card admin-card--tight" key={faq.id}>
            <Form method="post">
              <input type="hidden" name="intent" value="faq-edit" />
              <input type="hidden" name="id" value={faq.id} />
              <input type="hidden" name="part" value="question" />
              <div className="admin-grid">
                <label className="admin-field">
                  <span>Question</span>
                  <input
                    type="text"
                    name="value"
                    defaultValue={faq.question}
                    onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                  />
                </label>
              </div>
            </Form>
            <Form method="post">
              <input type="hidden" name="intent" value="faq-edit" />
              <input type="hidden" name="id" value={faq.id} />
              <input type="hidden" name="part" value="answer" />
              <label className="admin-field" style={{ marginTop: 12 }}>
                <span>Answer</span>
                <textarea
                  name="value"
                  defaultValue={faq.answer}
                  onBlur={(e) => e.currentTarget.form?.requestSubmit()}
                />
              </label>
            </Form>
            <div className="admin-actions">
              <Form method="post">
                <input type="hidden" name="id" value={faq.id} />
                <input type="hidden" name="dir" value="-1" />
                <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="faq-move">
                  ↑
                </button>
              </Form>
              <Form method="post">
                <input type="hidden" name="id" value={faq.id} />
                <input type="hidden" name="dir" value="1" />
                <button className="btn btn--xs btn--ghost" type="submit" name="intent" value="faq-move">
                  ↓
                </button>
              </Form>
              <Form method="post">
                <input type="hidden" name="id" value={faq.id} />
                <button
                  className="btn btn--xs btn--danger"
                  type="submit"
                  name="intent"
                  value="faq-delete"
                  onClick={(e) => {
                    if (!window.confirm("Delete this question?")) e.preventDefault();
                  }}
                >
                  Delete
                </button>
              </Form>
            </div>
          </div>
        ))
      )}
    </>
  );
}
