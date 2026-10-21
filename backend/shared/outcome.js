// Transport-independent operation results. No Express objects in services.
const status = Object.freeze({
  OK: 200, CREATED: 201, ACCEPTED: 202, NO_CONTENT: 204,
  INVALID: 400, UNAUTHENTICATED: 401, FORBIDDEN: 403,
  NOT_FOUND: 404, CONFLICT: 409, UNPROCESSABLE: 422, INTERNAL_ERROR: 500,
});
const outcome = (code, data) => {
  if (!Object.prototype.hasOwnProperty.call(status, code)) throw new Error(`Unknown outcome ${code}`);
  return { code, data };
};
const toHttpStatus = code => status[code] || 500;
module.exports = { outcome, toHttpStatus };
