describe('Comment module', () =>{
    const deletedId = Cypress._.random(1,5)
    before('login', () => cy.login())

    describe('Create comment', () =>{
        // 1. return unauthorized
        // 2. return error validation
        // 3. return correct comments
        // 4. found in get post by id endpoint
        // 5. found in all posts endpoint

        it('Should return unauthorized', () =>{
            cy.checkUnauthorized('POST', '/comments')
        })

        it('Should return error validation', () =>{
            cy.request({
                method: 'POST',
                url: '/comments',
                headers: {
                    authorization : `Bearer ${Cypress.env('token')}`
                },
                failOnStatusCode: false,
            }).then(response => {
                cy.badRequest(response, [
                    "post_id should not be empty",
                    "post_id must be a number conforming to the specified constraints", 
                    "content should not be empty", 
                    "content must be a string"
                ])
            })
        })

        it('Should return correct comments', () =>{
            cy.generateCommentsData(5)

            cy.fixture('comments').then(commentsData =>{
                commentsData.forEach((_comment) => {
                    cy.request({
                        method: 'POST',
                        url: '/comments',
                        headers: {
                            authorization : `Bearer ${Cypress.env('token')}`
                        },
                        body: _comment
                    }).then((response) =>{
                        const {
                            success,
                            data: {post_id, content},
                        } = response.body

                        expect(response.status).to.eq(201)
                        expect(success).to.be.true
                        expect(post_id).to.eq(_comment.post_id)
                        expect(content).to.eq(_comment.content)
                    })
                })
            })
        })

        it('Should found in get post by id endpoint', () =>{
            cy.fixture('comments').then((commentsData) =>{
                cy.request({
                    method: 'GET',
                    url: `/posts/${commentsData[0].post_id}`,
                    headers: {
                        authorization : `Bearer ${Cypress.env('token')}`
                    },
                }).then(response =>{
                    const {comments} = response.body.data
                    const isFound = comments.some(
                        (comment) => comment.content === commentsData[0].content
                    )

                    expect(comments).to.be.ok
                    expect(isFound).to.be.true
                })
            })
        })

        it('Should found in get all posts endpoint', () =>{
            cy.request({
                method: 'GET',
                url: `/posts`,
                headers: {
                    authorization : `Bearer ${Cypress.env('token')}`
                },
            }).then(response =>{
                    cy.fixture('comments').then((commentsData) =>{
                    const posts = response.body.data
                    commentsData.forEach((comment) =>{
                        const isFound = posts.find((post) => post.id === comment.post_id).comments.some((_comment) => _comment.content === comment.content)
                        expect(isFound).to.be.ok
                    })

                })
            })
        })
    })

    describe('Delete comment', () =>{
        // 1. return unauthorized
        // 2. return not found
        // 3. successfully deleted
        // 4. not found in detail post endpoint

        it('Should return unauthorized', () =>{
            cy.checkUnauthorized('DELETE', '/comments/5')
        })

        it('Should return not found', () =>{
            cy.request({
                method: 'DELETE',
                url: `/comments/${Cypress._.random(6,10)}`,
                headers: {
                    authorization: `Bearer ${Cypress.env('token')}`
                },
                failOnStatusCode: false
            }).then(response =>{
                expect(response.status).to.eq(404)
            })
        })

        it('Should successfully deleted', () =>{
            cy.request({
                method: 'DELETE',
                url: `/comments/${deletedId}`,
                headers: {
                    authorization: `Bearer ${Cypress.env('token')}`
                },
                failOnStatusCode: false
            }).then(response =>{
                const {message, success} = response.body
                expect(response.status).to.eq(200)
                expect(message).to.eq('Comment deleted successfully')
                expect(success).to.be.true
            })
        })

        it('Should not found in detail post endpoint', () =>{
            cy.fixture('comments').then(commentsData =>{
                const deletedComment = commentsData[deletedId-1]

                cy.request({
                    method: 'GET',
                    url: `/posts/${deletedComment.post_id}`,
                    headers:{
                        authorization: `Bearer ${Cypress.env('token')}`
                    }
                }).then(response =>{
                    const {comments} = response.body.data
                    const isFound = comments.some((comment) => comment.id === deletedId && comment.content === deletedComment.content)

                    expect(isFound).to.be.false
                })
            })
        })
    })
})