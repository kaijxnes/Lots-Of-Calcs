const historyEl = document.getElementById("history");
const currentEl = document.getElementById("current");

let angleMode = "deg";
let expr = "";
let justEvaluated = false;

function formatNumber(value) {
  if (!isFinite(value)) return "Error";
  const rounded = Math.round((value + Number.EPSILON) * 1e10) / 1e10;
  return rounded.toString();
}

function render() {
  currentEl.textContent = expr === "" ? "0" : expr;
}

/* ---------- Tokenizer ---------- */
function tokenize(source) {
  const tokens = [];
  let i = 0;
  while (i < source.length) {
    const ch = source[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < source.length && /[0-9.]/.test(source[i])) {
        num += source[i];
        i++;
      }
      tokens.push({ type: "num", value: parseFloat(num) });
      continue;
    }
    if (source.slice(i, i + 4) === "sqrt") {
      tokens.push({ type: "func", value: "sqrt" });
      i += 4;
      continue;
    }
    if (["sin", "cos", "tan", "log"].includes(source.slice(i, i + 3))) {
      tokens.push({ type: "func", value: source.slice(i, i + 3) });
      i += 3;
      continue;
    }
    if (source.slice(i, i + 2) === "ln") {
      tokens.push({ type: "func", value: "ln" });
      i += 2;
      continue;
    }
    if (ch === "π") {
      tokens.push({ type: "const", value: "pi" });
      i++;
      continue;
    }
    if (ch === "e") {
      tokens.push({ type: "const", value: "e" });
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i++;
      continue;
    }
    if ("+−×÷^%".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    throw new Error("Unexpected character: " + ch);
  }
  return tokens;
}

/* ---------- Recursive-descent parser ---------- */
function applyFunction(name, arg) {
  const angle = angleMode === "deg" ? (arg * Math.PI) / 180 : arg;
  switch (name) {
    case "sin":
      return Math.sin(angle);
    case "cos":
      return Math.cos(angle);
    case "tan":
      return Math.tan(angle);
    case "log":
      return arg <= 0 ? NaN : Math.log10(arg);
    case "ln":
      return arg <= 0 ? NaN : Math.log(arg);
    case "sqrt":
      return arg < 0 ? NaN : Math.sqrt(arg);
    default:
      return NaN;
  }
}

function evaluate(tokens) {
  let pos = 0;
  const peek = () => tokens[pos];
  const next = () => tokens[pos++];

  function parseExpr() {
    let value = parseTerm();
    while (peek() && peek().type === "op" && (peek().value === "+" || peek().value === "−")) {
      const op = next().value;
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm() {
    let value = parseUnary();
    while (peek() && peek().type === "op" && (peek().value === "×" || peek().value === "÷")) {
      const op = next().value;
      const rhs = parseUnary();
      value = op === "×" ? value * rhs : value / rhs;
    }
    return value;
  }

  /* A leading minus binds more loosely than a power, as on paper and on
     scientific calculators: −2^2 is −(2^2) = −4, not (−2)^2 */
  function parseUnary() {
    if (peek() && peek().type === "op" && peek().value === "−") {
      next();
      return -parseUnary();
    }
    return parsePower();
  }

  /* Right-associative, and the exponent may carry its own sign: 2^3^2 is
     2^9, and 2^−1 is 0.5 */
  function parsePower() {
    const base = parsePostfix();
    if (peek() && peek().type === "op" && peek().value === "^") {
      next();
      return Math.pow(base, parseUnary());
    }
    return base;
  }

  function parsePostfix() {
    let value = parsePrimary();
    while (peek() && peek().type === "op" && peek().value === "%") {
      next();
      value = value / 100;
    }
    return value;
  }

  function parsePrimary() {
    const tok = peek();
    if (!tok) throw new Error("Unexpected end of expression");
    if (tok.type === "num") {
      next();
      return tok.value;
    }
    if (tok.type === "const") {
      next();
      return tok.value === "pi" ? Math.PI : Math.E;
    }
    if (tok.type === "func") {
      next();
      if (!peek() || peek().type !== "lparen") throw new Error("Expected ( after function");
      next();
      const arg = parseExpr();
      if (!peek() || peek().type !== "rparen") throw new Error("Expected )");
      next();
      return applyFunction(tok.value, arg);
    }
    if (tok.type === "lparen") {
      next();
      const value = parseExpr();
      if (!peek() || peek().type !== "rparen") throw new Error("Expected )");
      next();
      return value;
    }
    throw new Error("Unexpected token");
  }

  const result = parseExpr();
  if (pos !== tokens.length) throw new Error("Unexpected trailing input");
  return result;
}

/* ---------- Input handling ---------- */
function ensureImplicitMultiply() {
  if (expr.length === 0) return;
  if (/[0-9)πe%]$/.test(expr)) {
    expr += "×";
  }
}

function inputNumber(digit) {
  if (justEvaluated) {
    expr = digit;
    justEvaluated = false;
  } else {
    expr += digit;
  }
  render();
}

function inputDecimal() {
  if (justEvaluated) {
    expr = "0.";
    justEvaluated = false;
    render();
    return;
  }
  let i = expr.length - 1;
  while (i >= 0 && /[0-9.]/.test(expr[i])) i--;
  const segment = expr.slice(i + 1);
  if (segment.includes(".")) return;
  expr += segment === "" ? "0." : ".";
  render();
}

function inputOperator(op) {
  justEvaluated = false;
  expr += op;
  render();
}

function inputParen(value) {
  justEvaluated = false;
  if (value === "(") {
    ensureImplicitMultiply();
    expr += "(";
  } else {
    const opens = (expr.match(/\(/g) || []).length;
    const closes = (expr.match(/\)/g) || []).length;
    if (opens > closes) expr += ")";
  }
  render();
}

function inputFunction(name) {
  justEvaluated = false;
  ensureImplicitMultiply();
  expr += name + "(";
  render();
}

function inputSquare() {
  justEvaluated = false;
  expr += "^2";
  render();
}

function inputConstant(name) {
  justEvaluated = false;
  ensureImplicitMultiply();
  expr += name === "pi" ? "π" : "e";
  render();
}

function inputPercent() {
  justEvaluated = false;
  expr += "%";
  render();
}

function clearAll() {
  expr = "";
  justEvaluated = false;
  historyEl.textContent = "";
  render();
}

function deleteLast() {
  if (expr.length > 0) expr = expr.slice(0, -1);
  justEvaluated = false;
  render();
}

function handleEquals() {
  if (expr === "") return;

  let toEval = expr;
  const opens = (toEval.match(/\(/g) || []).length;
  const closes = (toEval.match(/\)/g) || []).length;
  for (let i = 0; i < opens - closes; i++) toEval += ")";

  let result;
  try {
    result = evaluate(tokenize(toEval));
  } catch (e) {
    result = NaN;
  }

  if (!isFinite(result)) {
    historyEl.textContent = toEval + " =";
    expr = "";
    justEvaluated = false;
    currentEl.textContent = "Error";
    return;
  }

  historyEl.textContent = toEval + " =";
  expr = formatNumber(result);
  justEvaluated = true;
  render();
}

function setAngleMode(mode) {
  angleMode = mode;
  document.querySelectorAll(".key-mode").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.value === mode);
  });
}

function handleAction(action, value) {
  switch (action) {
    case "number":
      inputNumber(value);
      break;
    case "decimal":
      inputDecimal();
      break;
    case "clear":
      clearAll();
      break;
    case "delete":
      deleteLast();
      break;
    case "percent":
      inputPercent();
      break;
    case "operator":
      inputOperator(value);
      break;
    case "paren":
      inputParen(value);
      break;
    case "equals":
      handleEquals();
      break;
    case "unary":
      if (value === "square") {
        inputSquare();
      } else {
        inputFunction(value);
      }
      break;
    case "constant":
      inputConstant(value);
      break;
    case "angle-mode":
      setAngleMode(value);
      break;
  }
}

document.querySelector(".keys").addEventListener("click", (event) => {
  const button = event.target.closest(".key");
  if (!button) return;
  handleAction(button.dataset.action, button.dataset.value);
});

document.addEventListener("keydown", (event) => {
  const { key } = event;

  if (/^[0-9]$/.test(key)) {
    handleAction("number", key);
    return;
  }

  switch (key) {
    case ".":
      handleAction("decimal");
      break;
    case "+":
      handleAction("operator", "+");
      break;
    case "-":
      handleAction("operator", "−");
      break;
    case "*":
      handleAction("operator", "×");
      break;
    case "/":
      event.preventDefault();
      handleAction("operator", "÷");
      break;
    case "^":
      handleAction("operator", "^");
      break;
    case "(":
      handleAction("paren", "(");
      break;
    case ")":
      handleAction("paren", ")");
      break;
    case "Enter":
    case "=":
      handleAction("equals");
      break;
    case "Backspace":
      handleAction("delete");
      break;
    case "Escape":
      handleAction("clear");
      break;
    case "%":
      handleAction("percent");
      break;
  }
});

render();
