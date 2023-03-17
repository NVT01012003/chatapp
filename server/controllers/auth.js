export const addRefreshToken = async (db, { token, user_id }) => {
    await db.query(`
        create table if not exists refresh_tokens(
            user_id varchar(255) not null,
            token varchar(255) not null
        );
    `);
    const token_added = await db.query(`
        insert into refresh_tokens (token, user_id) 
        values ('${token}', '${user_id}');
    `);
    if (token_added.rowCount == 1) return true;
    else throw new Error("Add failed!");
};

export const getRefreshToken = async (db, { user_id }) => {
    const token = await db.query(`
        select token from refresh_tokens 
        where user_id = '${user_id}';
    `);
    return token.rows[0].token;
};

export const updateRefreshToken = async (db, { user_id, token }) => {
    const token_updated = await db.query(`
        update refresh_tokens 
        set token = '${token}' 
        where user_id = '${user_id}';
    `);
    if (token_updated.rowCount == 1) return true;
    else throw new Error("Update failed!");
};

export const deleteRefreshToken = async (db, { user_id }) => {
    const token_deleted = await db.query(`
        delete from refresh_tokens 
        where user_id = '${user_id}';
    `);
    if (token_deleted.rowCount == 1) return true;
    else throw new Error("Delete failed!");
};

export const getPrivateInfo = async (db, { id, email }) => {
    try {
        if (email) {
            var user = await db.query(`
                select password, id from users 
                where email = '${email}';
            `);
        } else {
            var user = await db.query(`
                select email, password from users 
                where id = '${id}';
            `);
        }
        return user.rows[0];
    } catch (e) {
        if (e.message == `relation "users" does not exist`) return false;
        else throw new Error(e.message);
    }
};

export const deleteUser = async (db, { user_id }) => {
    const user = await db.query(`
        delete from users where user_id = '${user_id}';
    `);
    if (user.rowCount == 1) return true;
    else throw new Error("Delete failed!");
};

export const updateEmail = async (db, { user_id, email }) => {
    const email_updated = await db.query(`
        update users set email='${email}' 
        where user_id = '${user_id}';
    `);
    if (email_updated.rowCount == 1) return true;
    else throw new Error("Update failed!");
};

export const updatePassword = async (db, { user_id, password }) => {
    const password_updated = await db.query(`
        update users set password='${password}' 
        where user_id = '${user_id}';
    `);
    if (password_updated.rowCount == 1) return true;
    else throw new Error("Update failed!");
};