import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { UnauthorizedException } from "../utils/app-error";
import { Env } from "./env.config";
import { findByIdUserService } from "../services/user.service";

passport.use(new JwtStrategy(
    {
        jwtFromRequest: ExtractJwt.fromExtractors([
            (req) => {
                const token = req.cookies.accessToken;
                if(!token) {
                    throw new UnauthorizedException("Unauthorized Access");
                }
                return token;
            }
        ]),
        secretOrKey: Env.JWT_SECRET,
        audience: ["user"],
        algorithms: ["HS256"],
    },
    async ({userId}, done) => {
        try {
            const user = userId && (await findByIdUserService(userId));
            return done(null, user || false);
        } catch (error) {
            return done(error, false);
        }
    }
));

export const passportAuthenticateJWT = passport.authenticate("jwt", {session: false});