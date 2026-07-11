import { app } from "@/config/application.ts";
import {
  EntityNotFoundException,
  ForbiddenException,
  getBookById,
  getOrCreateDatabasePool,
  isReaderOfBookList,
  setReadingPlan,
  setReadingPlanSchema,
  syncReadingPlansFromMoly,
} from "@sffvektor/lib";
import { validateBody } from "@/middlewares/validator.ts";
import { isUserAdminMiddleware } from "@/middlewares/role-check.ts";
import { HttpStatusCode } from "@/helpers/http-code.ts";
import { mapExceptions } from "@/middlewares/map-exceptions.ts";

const setReadingPlanApiSchema = setReadingPlanSchema.strict();

const notAJuryMemberError = "You are not a jury member for this book list";

app.put(
  "/api/reading-plans",
  validateBody(setReadingPlanApiSchema),
  mapExceptions(
    [EntityNotFoundException, HttpStatusCode.NotFound],
  ),
  async (c) => {
    const user = c.get("user");
    const { bookId, status } = c.req.valid("form");
    const pool = await getOrCreateDatabasePool();

    // A reader may only edit their own plan; the reader is taken from the
    // authenticated user, never from the request body.
    if (!user.readerId) {
      throw new ForbiddenException(notAJuryMemberError, "NOT_A_JURY_MEMBER");
    }

    const book = await getBookById(pool, bookId);
    if (
      !book.genre ||
      !(await isReaderOfBookList(pool, book.year, book.genre, user.readerId))
    ) {
      throw new ForbiddenException(notAJuryMemberError, "NOT_A_JURY_MEMBER");
    }

    await setReadingPlan(pool, { readerId: user.readerId, bookId, status });
    return c.json({ message: "Reading plan updated" });
  },
);

app.post(
  "/api/reading-plans/sync-from-moly",
  isUserAdminMiddleware,
  async (c) => {
    const result = await syncReadingPlansFromMoly();
    return c.json(result);
  },
);
