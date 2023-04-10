describe('Post module', () =>{
    const dataCount = 15
    const randomID = Cypress._.random(16, 50)

    before('login', () =>{
        cy.login()
    })

    before('generate posts data', () =>cy.generatePostsData(dataCount))

    describe('Create post', () =>{
        // 1. return unauthorized
        // 2. return error validation messages
        // 3. return correct post

        it('Should return unauthorized', () =>{
            cy.checkUnauthorized('POST', '/posts')
        })

        it('Should return error validation messages', () =>{
            cy.request({
                method: 'POST',
                url: '/posts',
                headers: {
                    authorization: `Bearer ${Cypress.env('token')}`
                },
                failOnStatusCode: false
            }).then((response) =>{
                cy.badRequest(response, ['title must be a string', 'content must be a string'])
            })
        })

        it('Should return correct post', () =>{
            cy.fixture('posts').then((postData) =>{
                
                cy.request({
                    method: 'POST',
                    url: '/posts',
                    headers: {
                        authorization: `Bearer ${Cypress.env('token')}`
                    },
                    body: {
                        title: postData[0].title,
                        content: postData[0].content
                    }
                }).then((response) =>{
                    const {success, data: {title, content, comments}} = response.body
                    expect(response.status).to.eq(201)
                    expect(response.body.success).to.be.true
                    expect(title).to.eq(postData[0].title)
                    expect(content).to.eq(postData[0].content)
                    expect(comments.length).to.eq(0)
                })
            })
        })
            
    })

    describe('Get all posts', () =>{
        // 1. return unauthorized
        // 2. return correct count and data

        it('Should return unauthorized', () =>{
            cy.checkUnauthorized('GET', '/posts')
        })

        it('Should return correct count and data', () =>{
            cy.fixture('posts').then((postData) =>{
                cy.createPosts(postData)

                cy.request({
                    method: 'GET',
                    url: '/posts',
                    headers: {
                        authorization: `Bearer ${Cypress.env('token')}`
                    }
                }).then(response =>{
                    expect(response.status).to.eq(200)
                    expect(response.body.success).to.be.true
                    expect(response.body.data.length).to.eq(postData.length)

                    postData.forEach((_post,index) => {
                        expect(response.body.data[index].id).to.eq(index+1)
                        expect(response.body.data[index].title).to.eq(_post.title)
                        expect(response.body.data[index].content).to.eq(_post.content)
                    });
                })
            })
        })

    })

    describe('Get by ID', () =>{
        // 1. return unauthorized
        // 2. return correct data
        // 3. return not found

        it('Should return unauthorized', () =>{
            cy.checkUnauthorized('GET', '/posts/991')
        })

        it('Should return correct data', () =>{
            cy.fixture('posts').then((postData) =>{
                postData.forEach((_post, index) =>{
                    cy.request({
                        method: 'GET',
                        url: `/posts/${index+1}`,
                        headers: {authorization: `Bearer ${Cypress.env('token')}`},
                    }).then((response) => {
                        const {title, content} = response.body.data
                        expect(response.status).to.be.ok
                        expect(title).to.eq(_post.title)
                        expect(content).to.eq(_post.content)
                    })
                })
            })
        })

        it('Should return not found', () =>{
            cy.request({
                method: 'GET',
                url: `/posts/${randomID}`,
                headers: {authorization: `Bearer ${Cypress.env('token')}`},
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404)
                expect(response.body.success).to.be.false
                expect(response.body.data).to.be.null
            })
        })
    })

    describe('Update post', () =>{
        // 1. return unauthorized
        // 2. return not found
        // 3. return error validation messages
        // 4. return correct updated post

        it('Should return unauthorized', () =>{
            cy.checkUnauthorized('PATCH', '/posts/991')
        })

        it('Should return not found', () =>{
            cy.request({
                method: 'PATCH',
                url: `/posts/${randomID}`,
                headers: {authorization: `Bearer ${Cypress.env('token')}`},
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404)
                expect(response.body.success).to.be.false
                expect(response.body.data).to.be.null
            })
        })

        it('Should return error validation messages', () =>{
            cy.request({
                method: 'PATCH',
                url: `/posts/1`,
                headers: {authorization: `Bearer ${Cypress.env('token')}`},
                failOnStatusCode: false,
                body: {
                    title: false,
                    content: randomID
                }
            }).then((response) => {
                cy.log({response})
                cy.badRequest(response, ['title must be a string', 'content must be a string'])
            })
        })

        it('Should return correct updated post', () =>{
            const updatedPost = {
                id: 1,
                title: 'updated title',
                content: 'updated content',
            }

            cy.request({
                method: 'PATCH',
                url: `/posts/${updatedPost.id}`,
                headers: {authorization: `Bearer ${Cypress.env('token')}`},
                body: {
                    title: updatedPost.title,
                    content: updatedPost.content
                }
            }).then((response) => {
                const {success, data: {title, content}} = response.body
                expect(response.status).to.be.ok
                expect(success).to.be.true
                expect(title).to.eq(updatedPost.title)
                expect(content).to.eq(updatedPost.content)
                expect(response.body.message).to.eq('Post updated successfully')
            })

            cy.request({
                method: 'GET',
                url: `/posts/${updatedPost.id}`,
                headers: {authorization: `Bearer ${Cypress.env('token')}`},
            }).then((response) => {
                const {title, content} = response.body.data
                expect(response.status).to.be.ok
                expect(title).to.eq(updatedPost.title)
                expect(content).to.eq(updatedPost.content)
            })

            cy.request({
                method: 'GET',
                url: '/posts',
                headers: {
                    authorization: `Bearer ${Cypress.env('token')}`
                }
            }).then(response =>{
                const post = response.body.data.find((_post) => _post.id === updatedPost.id)
                expect(post.title).to.eq(updatedPost.title)
                expect(post.content).to.eq(updatedPost.content)
            })
        })
    })

    describe('Delete post', () =>{
        // 1. return unauthorized
        // 2. return not found
        // 3. return successfully remove the post
        // 4. not be found the deleted post

        it('Should return unauthorized', () =>{
            cy.checkUnauthorized('DELETE', '/posts/991')
        })

        it('Should return not found', () =>{
            cy.request({
                method: 'DELETE',
                url: `/posts/${randomID}`,
                headers: {authorization: `Bearer ${Cypress.env('token')}`},
                failOnStatusCode: false
            }).then((response) => {
                expect(response.status).to.eq(404)
                expect(response.body.success).to.be.false
                expect(response.body.data).to.be.null
            })
        })

        it('Should return successfully remove the post', () =>{
            cy.request({
                method: 'DELETE',
                url: `/posts/1`,
                headers: {authorization: `Bearer ${Cypress.env('token')}`}
            }).then((response) => {
                expect(response.status).to.be.ok
                expect(response.body.success).to.be.true
                expect(response.body.message).to.eq('Post deleted successfully')
            })
        })

        it('Should not be found the deleted post', () =>{
            cy.request({
                method: 'GET',
                url: `/posts/1`,
                headers: {authorization: `Bearer ${Cypress.env('token')}`},
                failOnStatusCode: false
            }).then((response) => {
                
                expect(response.status).to.eq(404)
            })

            cy.request({
                method: 'GET',
                url: '/posts',
                headers: {
                    authorization: `Bearer ${Cypress.env('token')}`
                }
            }).then(response =>{
                const post = response.body.data.find((_post) => _post.id === 1)
                expect(post).to.be.undefined
            })
        })
    })
})