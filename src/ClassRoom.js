import React from 'react';
import Amplify, { Auth } from 'aws-amplify';
import API, { graphqlOperation } from '@aws-amplify/api'
import { Button, Header, Segment, Form, List } from 'semantic-ui-react'

import * as queries from './graphql/queries'
import * as mutations from './graphql/mutations'
import * as subscriptions from './graphql/subscriptions'

export default class ClassRoom extends React.Component {

    constructor(props) {
        super(props);
        this.state = { name: "", email: "", classrooms: [] };
        this.name = React.createRef();
        this.emails = React.createRef();
    }


    async componentDidMount() {
        let { data } = await API.graphql(graphqlOperation(queries.listClassRooms));
        console.log(data);
        this.setState({ classrooms: data.listClassRooms.items });


        const {username} = await Auth.currentAuthenticatedUser();

        this.subscription = API.graphql(
            graphqlOperation(subscriptions.onDeleteClassRoom,{owner: username})
        ).subscribe({
            next: data => {
                console.log(data);
                const classroom = data.value.data.onDeleteClassRoom;
                const classrooms = [
                    ...this.state.classrooms.filter(r => {
                        return r.name !== classroom.name;
                    })
                ];
                this.setState({ classrooms });
            }
        });
        
        this.subscription = API.graphql(
            graphqlOperation(subscriptions.onCreateClassRoom,{owner: username})
        ).subscribe({
            next: data => {
                console.log(data);
                const classroom = data.value.data.onCreateClassRoom;
                const classrooms = [
                    ...this.state.classrooms,
                    classroom
                ];
                this.setState({ classrooms });
            }
        });
    }

    componentWillUnmount() {
        this.subscription.unsubscribe();
    }


    handleChange = (e, { name, value }) => this.setState({
        [name]: value
    })

    handleSubmit = async(event) => {
        event.preventDefault();
        try {
            const { name, emails } = this.state;

            console.log({ name, emails });
            const emailsList = emails.split("\n");

            let result = await API.graphql(graphqlOperation(mutations.createClassRoom, {
                input: {
                    name,
                    studentEmails: emailsList
                }
            }));
            console.log(result);
        }
        catch (err) {
            console.error(err);
        }
        this.setState({ name: '', description: '', emails: '' });
    };

    onDeleteClick = async(event) => {
        event.preventDefault();
        console.log(event.target.text);
        let name = event.target.text;
        let result = await API.graphql(graphqlOperation(mutations.deleteClassRoom, {
            input: {
                name
            }
        }));
        console.log(result);
    }


    render() {
        const { classrooms } = this.state;

        const ClassRoomItems = classrooms.map(item =>
            <List.Item 
                key={item.name} 
                as='a'
                onClick={this.onDeleteClick}
            >
            {item.name}
            </List.Item>
        );
        const ListClassRoom = () => (classrooms.length > 0 ? (
            <div>
                <Header as='h3'>Click and delete the classroom</Header>
                <List>
                    {ClassRoomItems}
                </List>
            </div>
        ) : "");

        return (
            <Segment>
              <Header as='h3'>Create or Update a new Classroom</Header>
              <Form onSubmit={this.handleSubmit}>
                <Form.Group widths='equal'>
                  <Form.Input 
                    name='name' 
                    label='Name' 
                    placeholder='Name' 
                    value={this.state.name} 
                    fluid
                    required  
                    onChange={this.handleChange}/>
                </Form.Group>
                <Form.TextArea 
                    name='emails' 
                    label='Student Emails' 
                    placeholder='One email per line' 
                    value={this.state.emails} 
                    required  
                    onChange={this.handleChange}/>
                <Button type='submit'>Submit</Button>
              </Form>
              <ListClassRoom/>
              
            </Segment>
        );
    }

}
